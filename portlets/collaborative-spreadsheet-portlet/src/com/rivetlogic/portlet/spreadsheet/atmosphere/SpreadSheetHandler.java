package com.rivetlogic.portlet.spreadsheet.atmosphere;

import com.liferay.portal.kernel.cache.MultiVMPoolUtil;
import com.liferay.portal.kernel.cache.PortalCache;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.StringPool;
import com.liferay.portal.model.User;
import com.liferay.portal.model.UserConstants;
import com.liferay.portal.service.UserLocalServiceUtil;
import com.liferay.portal.util.PortalUtil;
import com.rivetlogic.portlet.spreadsheet.atmosphere.model.UserData;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentSkipListMap;

import org.atmosphere.client.TrackMessageSizeInterceptor;
import org.atmosphere.config.service.AtmosphereHandlerService;
import org.atmosphere.config.service.Singleton;
import org.atmosphere.cpr.AtmosphereResource;
import org.atmosphere.cpr.AtmosphereResourceEvent;
import org.atmosphere.handler.AtmosphereHandlerAdapter;
import org.atmosphere.interceptor.AtmosphereResourceLifecycleInterceptor;
import org.atmosphere.interceptor.BroadcastOnPostAtmosphereInterceptor;
import org.atmosphere.interceptor.SuspendTrackerInterceptor;
import org.atmosphere.util.SimpleBroadcaster;

/**
 * 
 * 
 * @author alejandro soto
 * 
 */

@Singleton

@AtmosphereHandlerService(  path = "/", supportSession = true, 
                            interceptors = {
                                AtmosphereResourceLifecycleInterceptor.class, 
                                TrackMessageSizeInterceptor.class,
                                BroadcastOnPostAtmosphereInterceptor.class, 
                                SuspendTrackerInterceptor.class }, 
                            broadcaster = SimpleBroadcaster.class)
public class SpreadSheetHandler extends AtmosphereHandlerAdapter {
	public static final String CACHE_NAME = SpreadSheetHandler.class.getName();
	private static final String ENCODING = "UTF-8";
	private static final Log LOG = LogFactoryUtil.getLog(SpreadSheetHandler.class);
	@SuppressWarnings("rawtypes")
    private static PortalCache portalCache = MultiVMPoolUtil.getCache(CACHE_NAME);
	
	/**
	 * Retrieves logged users from cache
	 * 
	 * @return
	 */
	@SuppressWarnings("unchecked")
    private ConcurrentMap<String, UserData> getLoggedUsersMap() {

        Object object = portalCache.get(SpreadSheetHandlerUtil.LOGGED_USERS_MAP_KEY);
        ConcurrentMap<String, UserData> loggedUserMap = (ConcurrentMap<String, UserData>) object;
        if (null == loggedUserMap) {
            loggedUserMap = new ConcurrentSkipListMap<String, UserData>();
            portalCache.put(SpreadSheetHandlerUtil.LOGGED_USERS_MAP_KEY, loggedUserMap);
        }
        return loggedUserMap;
    }
	
	@Override
    public void onRequest(AtmosphereResource resource) throws IOException {

        ConcurrentMap<String, UserData> loggedUserMap = getLoggedUsersMap();

        String userName = StringPool.BLANK;
        String userImagePath = StringPool.BLANK;
        String userId = StringPool.BLANK;
        
        // user joined
        String sessionId = resource.session().getId();
        if (loggedUserMap.get(sessionId) == null) {

            try {

                String baseImagePath = URLDecoder.decode(
                        resource.getRequest().getParameter(SpreadSheetHandlerUtil.BASE_IMAGEPATH), ENCODING);
                LOG.debug("base image path " + baseImagePath);

                User user = PortalUtil.getUser(resource.getRequest());
                long companyId = PortalUtil.getCompanyId(resource.getRequest());

                if (user == null || user.isDefaultUser()) {
                    LOG.debug("This is guest user");
                    user = UserLocalServiceUtil.getDefaultUser(companyId);
                    userName = LanguageUtil.get(LocaleUtil.getDefault(), SpreadSheetHandlerUtil.GUEST_USER_NAME_LABEL);
                } else {
                    userName = user.getFullName();
                }

                userImagePath = UserConstants.getPortraitURL(baseImagePath, user.isMale(), user.getPortraitId());
                userId = String.valueOf(user.getUserId());
                LOG.debug(String.format("User full name: %s, User image path: %s", userName, userImagePath));
            } catch (Exception e) {
                LOG.error(e.getMessage());
            }

            loggedUserMap.put(resource.session().getId(), new UserData(userName, userImagePath, userId));

            /* listens to disconnection event */
            resource.addEventListener(new SpreadSheetResourceEventListener(loggedUserMap, sessionId));
        }
    }
	
	@Override
    public void onStateChange(AtmosphereResourceEvent event) throws IOException {

        ConcurrentMap<String, UserData> loggedUserMap = getLoggedUsersMap();
       // ConcurrentMap<String, JSONObject> whiteBoardDump = getWhiteBoardDump();

        /* messages broadcasting */
        if (event.isSuspended()) {
            String message = event.getMessage() == null ? StringPool.BLANK : event.getMessage().toString();

            if (!message.equals(StringPool.BLANK)) {

                try {
                    JSONObject jsonMessage = JSONFactoryUtil.createJSONObject(message);
                    /* verify if user is signing in */
                    if (SpreadSheetHandlerUtil.LOGIN.equals(jsonMessage.getString(SpreadSheetHandlerUtil.ACTION))) {
                        JSONObject usersLoggedMessage = SpreadSheetHandlerUtil.generateLoggedUsersJSON(loggedUserMap);
                        //event.getResource().getBroadcaster().broadcast(usersLoggedMessage);
                        event.getResource().write(usersLoggedMessage.toString());
                    } else if (SpreadSheetHandlerUtil.CELL_HIGHLIGHTED.equals(jsonMessage.getString(SpreadSheetHandlerUtil.ACTION))) {
                        /* just broadcast the message */
//                        LOG.debug("Broadcasting = " + message);
                        event.getResource().write(SpreadSheetHandlerUtil.generateCommands(jsonMessage).toString());
                    }
                } catch (JSONException e) {
                    LOG.debug("JSON parse failed");
                }
            }
        } else if (event.isCancelled() || event.isClosedByClient()) {
        	JSONObject usersLoggedMessage = SpreadSheetHandlerUtil.generateLoggedUsersJSON(loggedUserMap);
            //event.getResource().getBroadcaster().broadcast(usersLoggedMessage);
            event.getResource().write(usersLoggedMessage.toString());
        }
    }
}

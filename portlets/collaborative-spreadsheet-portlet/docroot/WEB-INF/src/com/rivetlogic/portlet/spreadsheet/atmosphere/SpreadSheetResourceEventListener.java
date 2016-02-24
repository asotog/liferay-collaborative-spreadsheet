package com.rivetlogic.portlet.spreadsheet.atmosphere;

import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentSkipListMap;

import org.atmosphere.cpr.AtmosphereResourceEvent;
import org.atmosphere.cpr.AtmosphereResourceEventListener;

import com.liferay.portal.kernel.json.JSONObject;
import com.rivetlogic.portlet.spreadsheet.atmosphere.model.UserData;

public class SpreadSheetResourceEventListener implements AtmosphereResourceEventListener {
	/**
     * List of logged users.
     */
    private ConcurrentMap<String, UserData> loggedUserMap = new ConcurrentSkipListMap<String, UserData>();

    /**
     * Relates current connected user with the list of users.
     */
    private String sessionId = null;
	
	public SpreadSheetResourceEventListener(ConcurrentMap<String, UserData> loggedUserMap, String sessionId) {
		this.loggedUserMap = loggedUserMap;
        this.sessionId = sessionId;
	}
	
	@Override
	public void onBroadcast(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onClose(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onDisconnect(AtmosphereResourceEvent event) {
		/* removes user from map and broadcast users list again also with the unlogged user */
		UserData unloggedUser = this.loggedUserMap.get(sessionId);
		this.loggedUserMap.remove(sessionId);
		JSONObject users = SpreadSheetHandlerUtil.generateLoggedAndUnloggedUsersJSON(loggedUserMap, unloggedUser);
        event.getResource().getBroadcaster().broadcast(users);

	}

	@Override
	public void onPreSuspend(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onResume(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onSuspend(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onThrowable(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	public void onHeartbeat(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

}

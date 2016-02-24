package com.rivetlogic.portlet.spreadsheet.atmosphere;

import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentSkipListMap;

import org.atmosphere.cpr.AtmosphereResourceEvent;
import org.atmosphere.cpr.AtmosphereResourceEventListener;

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
		/* removes user from map and broadcast users list again */
        this.loggedUserMap.remove(sessionId);
        event.getResource().getBroadcaster().broadcast(SpreadSheetHandlerUtil.generateLoggedUsersJSON(loggedUserMap));

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

AUI.add(
    'rivet-collaboration-spreadsheet',
    function(A) {
        
        /**
        * Generates handlebars template from give template script tags by id
        *
        *
        */
        var getTemplate = function(id) {
            var templateString = A.one(id).get('innerHTML');
            return A.Handlebars.compile(templateString);
        };

        var TEMPLATES = {
            usersOnline: getTemplate('#spreadsheet-online-users')
        };

        var RivetCollaborationSpreadSheet = A.Component.create(
            {
                ATTRS: {
                    onlineUsers: {
                        value: []
                    }
                },
                
                CSS_PREFIX: 'table',

                EXTENDS: Liferay.RivetSpreadSheet,
                
                NAME: A.DataTable.Base.NAME,
                
                usersOnlineNode: null,

                prototype: {
                    ws: null,

                    initializer: function() {
                        this.bindCollaborativeEvents();
                        this.usersOnlineNode = this.get('srcNode').ancestor('.realtime-spreadsheet').one('.collaboration-users');
                    },
                    
                    bindCollaborativeEvents: function() {
                        this.bindAtmosphere();
                        this.after('onlineUsersChange', A.bind(this._renderOnlineUsers, this));
                    },
                    
                    /**
                    * Processes users when they get online or offline
                    *
                    *
                    */
                    _renderOnlineUsers: function(e) {
                        this.usersOnlineNode.empty();
                        this.usersOnlineNode.append(TEMPLATES.usersOnline({users: this.get('onlineUsers')}));
                    },
                    
                    /**
                    * Initializes and binds atmosphere events
                    *
                    *
                    */
                    bindAtmosphere: function() {
                        var instance = this;
                        var baseUrl = document.location.toString().split('/').slice(0, 3).join('/'); // gets only protocol, domain and port from current url
                        var request = {
                            url: baseUrl + '/delegate/collaborative-spreadsheet/?baseImagePath=' +
                                encodeURIComponent(Liferay.ThemeDisplay.getPathImage()),
                            trackMessageLength: true,
                            transport: 'websocket'
                            //logLevel: 'debug'
                        };

                        request.onMessage = function (response) {
                            instance.processMessage(response);
                        };

                        request.onOpen = function (response) {
                            instance.ws.push(A.JSON.stringify({
                                type:  RivetCollaborationSpreadSheet.CONSTANTS.LOGIN
                            }));
                        };
                        
                        request.onClose = function (response) {
                            console.log(response);
                        };

                        instance.ws = atmosphere.subscribe(request);
                    },
                    
                    /**
                    * Each time message arrives from messaging server, dispatches 
                    * the message by give action type
                    *
                    */
                    processMessage: function(response) {
                        var instance = this;
                        var data = A.JSON.parse(response.responseBody);
                        if (!data.commands) {
                            return;
                        }
                        A.Array.each(data.commands, function(item, index) {
                            switch(item.action) {
                                case RivetCollaborationSpreadSheet.CONSTANTS.USERS:
                                    instance.preProcessUsers(item.users)
                                    break;
                                default:
                                    console.error('Unable to match command');
                            };
                        });
                    },

                    /*
                    * Assigns colors to users and verifies if they are already viewing document
                    * because message returns all the users everytime another user joins
                    *
                    */
                    preProcessUsers: function(users) {
                        var instance = this;
                        var onlineUsersTmp = [];
                        A.Array.each(users, function(item, index) {
                            item.color = A.UsersColors.pickColor(item.userId);
                            // update highlight color for current user
                            if (item.userId === Liferay.ThemeDisplay.getUserId()) {
                                instance.set('highlightColor', item.color);
                            };
                            onlineUsersTmp.push(item);
                        });
                        this.set('onlineUsers', onlineUsersTmp);
                    }
                }
            });

            RivetCollaborationSpreadSheet.CONSTANTS = {
                LOGIN: 'login',
                USERS: 'users' // identify when users online updated
            };

            Liferay.RivetCollaborationSpreadSheet = RivetCollaborationSpreadSheet;
        },
    	'',
    	{
    		requires: ['rivet-spreadsheet-datatable', 'rivet-users-color', 'atmosphere', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'handlebars']
    	})

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
        
        /**
        * Generates users colors
        *
        *
        */
        var generateColors = function() {
            var N_COLORS = 100;
            var colors = [];
            for (var i = 0; i < N_COLORS; i++) {
                var color = [];
                for(var j = 0; j < 3; j++) {
                    color.push(Math.floor(Math.random() * 255));
                }
                colors.push('rgb(' + color.join(',') + ')');
            };
            return colors;
        };
        var pickColor = function(colors) {
            var i = Math.floor(Math.random() * colors.length);
            return colors.splice(i, 1)[0];
        };
        var COLORS = generateColors();

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
                        var onlineUsersTmp = [];
                        A.Array.each(users, function(item, index) {
                            item.color = pickColor(COLORS);
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
    		requires: ['rivet-spreadsheet-datatable', 'atmosphere', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'handlebars']
    	})

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
                        this.on('cellHighlighted', A.bind(this._currentUserCellHighlighted, this));
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
                    
                    _currentUserCellHighlighted: function(e) {
                        this.ws.push(A.JSON.stringify({
                            action:  RivetCollaborationSpreadSheet.CONSTANTS.CELL_HIGHLIGHTED,
                            userId: Liferay.ThemeDisplay.getUserId(),
                            record: e.record,
                            column: e.col    
                        }));
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
                                action:  RivetCollaborationSpreadSheet.CONSTANTS.LOGIN
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
                                    instance.onUsersMessage(item.users);
                                    break;
                                case RivetCollaborationSpreadSheet.CONSTANTS.CELL_HIGHLIGHTED:
                                    instance.onCellHighlightMessage(item);
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
                    onUsersMessage: function(users) {
                        var instance = this;
                        var onlineUsersTmp = [];
                        A.Array.each(users, function(item, index) {
                            item.color = A.UsersColors.pickColor(item.userId);
                            // update highlight color for current user
                            if (item.userId === Liferay.ThemeDisplay.getUserId()) {
                                instance.set('highlightColor', item.color);
                            };
                            item.userName = (item.userName === 'rivetlogic.spreadsheet.guest.name.label') ? 'Guest' : item.userName;
                            onlineUsersTmp.push(item);
                        });
                        this.set('onlineUsers', onlineUsersTmp);
                    },
                    
                    /*
                    * Highlight cells that belongs to other users interactions
                    * 
                    *
                    */
                    onCellHighlightMessage: function(data) {
                        var instance = this;
                        if (Liferay.ThemeDisplay.getUserId() === data.userId) {
                            return;
                        }
                        var cellSelector = '[data-yui3-record="' + data.record + '"] .' + data.column;
                        var cell = instance.get('boundingBox').one(cellSelector);
                        var user = instance.getUserFromOnlineList(data.userId);
                        instance._updateTitledHighlightCellByClasses({
                            title: user.userName,
                            refClass: 'usercell-' + data.userId,
                            cell: cell,
                            color: A.UsersColors.USERS_COLORS[data.userId]
                        });
                    },
                    
                    getUserFromOnlineList: function(userId) {
                        for (var i = 0; i < this.get('onlineUsers').length; i++) {
                            if (this.get('onlineUsers')[i].userId === userId) {
                                return this.get('onlineUsers')[i];
                            }
                        }
                    }
                }
            });

            RivetCollaborationSpreadSheet.CONSTANTS = {
                LOGIN: 'login',
                CELL_HIGHLIGHTED: 'cellHighlighted', // when users highlight cell
                USERS: 'users' // identify when users online updated
            };

            Liferay.RivetCollaborationSpreadSheet = RivetCollaborationSpreadSheet;
        },
    	'',
    	{
    		requires: ['rivet-spreadsheet-datatable', 'rivet-users-color', 'atmosphere', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'handlebars']
    	})

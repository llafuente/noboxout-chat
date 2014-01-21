(function () {
    "use strict";

    var object = require("object-enhancements"),
        __class =  require("node-class").class,
        Room = require("./room.js"),
        Server,
        return_true = function () { return true; },
        util = require("util");

    Server = __class("Server", {
        extends: ["Events"],

        server_id: null,
        server_name: null,
        welcome: null,

        users: [],
        rooms: [],

        perms : {
            list_public: true,
            list_private: false
        },

        initialize: function (server_id, server_name, welcome, perms, manager) {
            this.__parent();

            this.server_id = server_id;
            this.server_name = server_name;
            this.welcome = welcome;

            this.perms = object.merge(perms || {}, this.perms);

            this.manager = manager;
        },
        create_room: function (room_id, room_name, welcome, perms) {
            var r = new Room(room_id, room_name, welcome, perms, this, this.manager);
            this.rooms.push(r);

            return r;
        },
        destroy_room: function(room_id) {
            var i,
                max = this.rooms.length;

            for (i = 0; i < max; ++i) {
                if (this.rooms[i].room_id === room_id) {
                    this.rooms.splice(i, 1);
                    return true;
                }
            }
            return false;
        },
        get_room: function(room_id) {
            var i,
                r,
                max = this.rooms.length;

            for (i = 0; i < max; ++i) {
                r = this.rooms[i];
                if (r.room_id === room_id) {
                    return r;
                }
            }
            return null;
        },
        has_user: function(session_id) {
            return this.users.indexOf(session_id) !== -1;
        },
        get_list: function () {
            var room_list = [],
                r,
                p,
                i,
                max = this.rooms.length,
                list_public = this.perms.list_public,
                list_private = this.perms.list_private;

            for (i = 0; i < max; ++i) {
                r = this.rooms[i];
                p = r.perms.is_public;

                if ((list_public && p) || (list_private && !p)) {
                    room_list.push({
                        id: r.room_id,
                        name: r.room_name,
                        welcome: r.welcome
                    });
                }
            }

            return room_list;
        },
        // exclude should not exists...
        broadcast: function (message, exclude, callback) {
            message.room_id = this.room_id;
            exclude = exclude || [];

            console.log("#broadcasting", this.room_id, message);
            // populate with info!
            var i,
                max = this.users.length,
                info = [],
                user,
                wrap_callback = callback ? callback().after(max - exclude.length) : null;

            for (i = 0; i < max; ++i) {
                if (exclude.indexOf(this.users[i]) === -1) {
                    this.manager.send(message, this.users[i], wrap_callback);
                }
            }

            return this;
        },
        join: function (session_id) {
            if (this.users.indexOf(session_id) === -1) {
                this.users.push(session_id);

                this.emit(Server.SERVER_JOIN, [session_id, this.server_id]);
            }

            return this;
        },
        room_join: function (session_id, room_id) {
            var room = this.get_room(room_id);
            if (room) {
                if (room.join(session_id)) {
                    this.manager.get_user(session_id).addRoom(room_id);
                    return true;
                }
            }
            return false;
        },
        leave: function (session_id) {
            this.manager.get_user(session_id).rooms().forEach(function (room_id) {
                console.log(">== leave!", room_id);
                this.room_leave(session_id, room_id);
            }.bind(this));
        },
        room_leave: function (session_id, room_id) {
            var room = this.get_room(room_id);
            if (room) {
                if (room.leave(session_id)) {
                    this.manager.get_user(session_id).removeRoom(room_id);
                }
            }
        }

        /*,
        // global message to everyone
        message: function (text) {
            return this.broadcast({
                type: Server.SERVER_MESSAGE,
                from: "Bot"
            });
        }
        */
    });

    Server.SERVER_LEAVE = "server:leave";
    Server.SERVER_JOIN = "server:join";
    Server.SERVER_MESSAGE = "server:message";

    module.exports = Server;


/*
    var users = {
            "test-user-id-001" : "TEST01",
            "test-user-id-002" : "TEST02",
            "test-user-id-003" : "TEST03"
        },
        s = new Server(100, "test-server", "que pasa aki!!", {
        }, {
            send: function () { console.log("send = ", arguments); },
            get_user_list: function (session_ids) {
                var list = [];
                session_ids.forEach(function(id) {
                    list.push(users[id]);
                });
                return list;
            },
            get_user: function(session_id) {
                return {
                    addRoom: function() {console.log("==> add-room", arguments);},
                    removeRoom: function() {console.log("==> leave-room", arguments);},
                    rooms: function() { return [1]; },
                    get_username: function () {
                        return users[session_id];
                    }
                }
            }
        });


    s.join("test-user-id-001");
    s.join("test-user-id-002");

    s.create_room(1, "test-room-01", {});

    s.room_join("test-user-id-001", 1);
    s.room_join("test-user-id-002", 1);

    s.room_leave("test-user-id-002", 1);
    s.leave("test-user-id-002");
    //r.message("test-user-id-002", "que ocurre akí chiwakita!!!");
    //r.leave("test-user-id-002");
    console.log("******");
    console.log(util.inspect(s, {depth: 5, colors: true}));
*/

}(module));

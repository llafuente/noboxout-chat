(function () {
    "use strict";

    var __class = require("node-class").class,
        Iterable = require("node-class").Iterable,
        Server = require("./server.js"),
        User = require("./user.js"),
        language = require("./language.js"),
        Manager;

    function current_date() {
        var d = new Date(),
            h = d.getHours(),
            m = d.getMinutes(),
            s = d.getSeconds();

        return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }

    Manager = __class("Manager", {
        extends: ["Events"],

        language: null,
        users: null,
        servers: [],

        initialize: function () {
            this.__parent();
            this.users = new Iterable();

            this.language = language;

            this.emit("ready");
        },
        create_server: function (server_id, server_name, welcome, perms) {
            var s = new Server(server_id, server_name, welcome, perms, this);

            this.servers.push(s);

            s.pipeEvents(this);
        },
        get_server: function (server_id) {
            var i,
                s,
                max = this.servers.length;

            for (i = 0; i < max; ++i) {
                s = this.servers[i];
                if (s.server_id === server_id) {
                    return s;
                }
            }
            return null;
        },
        user_join: function (session_id, server_id, connection, callback) {
            // check session_id and later add it to the server!
            var user = new User(session_id, connection),
                server = this.get_server(server_id);

            if (server) {
                user.load_userdata(function (err) {
                    if (!err) {
                        if (server.join(session_id)) {
                            user.setServer(server_id);
                            console.log("set-user", session_id, user);
                            this.users.set(session_id, user);

                            user.relay_message({
                                success: true,
                                type: Server.SERVER_JOIN
                            });

                            this.emit(Manager.USER_JOIN, [user, this]);

                            return callback && callback(null, user);
                        }
                        callback && callback(new Error("unexpected-error"), null);
                    } else {
                        user.end_connection();
                        callback && callback(new Error("userdata-retrieval-failed"), null);
                    }
                }.bind(this));
            } else {
                callback && callback(new Error("server-not-found"), null);
                // err
                console.log("#server not found");
            }
        },
        user_leave: function (session_id) {
            var user = this.get_user(session_id),
                server;

            if (user) {
                server = this.get_server(user.server_id);
                if (server) {
                    server.leave(session_id);
                }
            }
        },
        get_user: function (session_id) {
            return this.users.get(session_id);
        },
        get_username: function (username) {
            var user = this.users.firstOf(function (u) {
                return u.get_username() === username;
            });

            return user ? user.value : null;
        },
        get_user_list: function (session_ids) {
            var user_list = [];

            if (!session_ids) {
                this.manager.each_user(function (user) {
                    user_list.push({
                        session_id: user.session_id,
                        name: user.get_username()
                    });
                });
            } else {
                session_ids.forEach(function (session_id) {
                    var user = this.get_user(session_id);
                    user_list.push({
                        session_id: user.session_id,
                        name: user.get_username()
                    });
                }.bind(this));
            }
            return user_list;
        },
        each_user: function (callback) {
            this.users.forEach(callback);
        },
        create_room: function (server_id, room_id, room_name, welcome, perms, callback) {
            var server = this.get_server(server_id),
                room;

            if (room_id === null) { //random
                room_id = server_id + "/" + (parseInt(Math.random() * 1000000, 10) + parseInt(Math.random() * 1000000, 10));
            }

            if (server) {
                room = server.get_room(room_id);
                if (!room) {
                    room = server.create_room(room_id, room_name, welcome, perms);
                    room.pipeEvents(this);
                    return callback && callback(null, room_id);
                }
                callback && callback(new Error("room-exists"), room_id);
            }
        },
        room_join: function (session_id, room_id, callback) {
            var user = this.get_user(session_id),
                server;

            if (user) {
                server = this.get_server(user.server_id);
                if (server) {
                    // TODO pass the callback ?!
                    if (server.room_join(session_id, room_id)) {
                        return callback && callback(null);
                    }
                    return callback && callback(new Error("unkown-error"));
                }
                return callback && callback(new Error("server-not-found"));
            }

            return callback && callback(new Error("user-not-found"));
        },
        room_leave: function (session_id, room_id, callback) {
            var user = this.get_user(session_id),
                server;

            if (user) {
                server = this.get_server(user.server_id);
                if (server) {
                    // TODO pass the callback ?!
                    server.room_leave(session_id, room_id);

                    return callback && callback(null);
                }
                return callback && callback(new Error("server-not-found"));
            }

            return callback && callback(new Error("user-not-found"));
        },
        room_message: function (session_id, room_id, message, callback) {
            var user = this.get_user(session_id),
                server,
                room;

            if (user) {
                server = this.get_server(user.server_id);
                if (server) {
                    // TODO pass the callback ?!
                    room = server.get_room(room_id);
                    if (room) {
                        return room.message(session_id, message, callback);
                    }
                    return callback && callback(new Error("room-not-found"));
                }
                return callback && callback(new Error("server-not-found"));
            }
            return callback && callback(new Error("user-not-found"));
        },
        relay_message: function (session_id, message, callback) {
            var user = this.get_user(session_id);

            if (message.lang) {
                message.lang.params = message.lang.params || {};
                message.lang.params.user = message.lang.params.user || user.get_username();

                message.lang.params.date = current_date();

                message.message = this.language.get(message.lang);
                delete message.lang;
            }
            user.relay_message(message, callback);
        }
    });

    Manager.USER_JOIN = "user:join";
    Manager.USER_LEAVE = "user:leave";

    module.exports = Manager;

}());
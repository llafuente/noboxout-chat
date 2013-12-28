(function () {
    "use strict";

    var Class =  require("node-class").Class,
        Events =  require("node-class").Events,
        Room,
        return_true = function () { return true; };

    Room = new Class("Room", {
        room_id: null,
        room_name: null,
        welcome: null,
        users: [],

        server: null,
        manager: null,

        perms : {
            is_public: true,
            destroy_on_empty: false,
            public_userlist: true,
            enter_notifications: true,
            leave_notifications: true,
            user_can_leave: true,
            max_users: 0,
            requisites: return_true
        }
    });

    Room.Extends(Events);

    Room.ROOM_LEAVE = "room:leave";
    Room.ROOM_JOIN = "room:join";
    Room.ROOM_MESSAGE = "room:message";
    Room.ROOM_EMPTY = "room:empty";
    Room.ROOM_FULL = "room:full";
    Room.ROOM_UPDATE = "room:update";

    Room.Implements({
        __construct: function (room_id, room_name, welcome, perms, server, manager) {
            this.parent();

            this.room_id = room_id;
            this.room_name = room_name;
            this.welcome = welcome;

            //this.perms = Object.merge(perms || {}, this.perms);

            perms = perms || {};

            this.perms.is_public = !(perms.is_public === false);
            this.perms.public_userlist = perms.public_userlist || this.perms.public_userlist;
            this.perms.enter_notifications = perms.enter_notifications || this.perms.enter_notifications;
            this.perms.leave_notifications = perms.leave_notifications || true;
            this.perms.max_users = perms.max_users || this.perms.max_users;
            this.perms.user_can_leave = perms.user_can_leave || this.perms.user_can_leave;
            this.perms.destroy_on_empty = perms.destroy_on_empty === true;
            this.perms.requisites = perms.requisites || this.perms.requisites;

            this.server = server;
            this.manager = manager;
        },
        // exclude should not exists...
        broadcast: function (message, exclude, callback) {
            message.room_id = this.room_id;
            message.room_name = this.room_name;
            exclude = exclude || [];

            // console.log("#broadcasting", this.room_id, message);
            // populate with info!
            var i,
                max = this.users.length,
                info = [],
                wrap_callback = callback ? callback().after(max - exclude.length) : null;

            for (i = 0; i < max; ++i) {
                if(exclude.indexOf(this.users[i]) === -1) {
                    this.manager.relay_message(this.users[i], message, wrap_callback);
                }
            }

            return this;
        },
        broadcast_user_list: function (callback) {
            this.broadcast({
                type: Room.ROOM_UPDATE,
                users: this.perms.public_userlist ? this.manager.get_user_list(this.users) : []
            }, null, callback);
        },
        /**
         * @return boolean if ok
         */
        join: function (session_id) {
        console.log("********************* join", session_id, this.manager.get_user(session_id).get_username());
            if (this.users.indexOf(session_id) === -1 && this.perms.requisites(session_id)) {
                if (this.perms.max_users > 0 && this.users.length >= this.perms.max_users) {
                    this.manager.send({
                        from: "Bot",
                        type: Room.ROOM_FULL,
                        room_id: null,
                        room_name: this.room_name,
                        lang: {
                            id: "room-full",
                            params: {
                                room_name: this.room_name,
                                max: this.perms.max_users
                            }
                        }
                    });
                } else {
                    this.users.push(session_id);

                    this.emit(Room.ROOM_JOIN, [session_id]);

                    if (this.perms.enter_notifications) {
                        this.broadcast({
                            from: "Bot",
                            type: Room.ROOM_JOIN,
                            lang: {
                                id: "user-join",
                                params: {user: this.manager.get_user(session_id).get_username()}
                            }
                        });
                        this.broadcast_user_list();
                    } else {
                        this.manager.get_user(session_id).relay_message(Room.ROOM_JOIN, {
                            from: "Bot",
                            type: Room.ROOM_JOIN,
                            lang: {
                                id: "user-join",
                                params: {user: this.manager.get_user(session_id).get_username()}
                            }
                        });
                    }


                    if (this.users.length >= this.perms.max_users) {
                        this.emit(Room.ROOM_FULL, [this]);
                    }

                    return true;
                }
            }
            return false;
        },
        leave: function (session_id) {
            var removed = false,
                cut = this.users.indexOf(session_id);

            if (cut !== false && this.perms.user_can_leave) {
                removed = true;
                this.users.splice(cut, 1);
            }


            if (removed) {
                this.emit(Room.ROOM_LEAVE, [session_id]);

                if (this.perms.leave_notifications) {
                    this.broadcast({
                        from: "Bot",
                        type: Room.ROOM_LEAVE,
                        lang: {
                            id: "user-leave",
                            params: {user: this.manager.get_user(session_id).get_username()}
                        }
                    });

                    this.broadcast_user_list();
                }

                if (this.users.length === 0) {
                    this.emit(Room.ROOM_EMPTY, [this]);
                    if (this.perms.destroy_on_empty) {
                        this.server.destroy_room(this.room_id);
                    }
                }
            }
        },
        message: function (from_session_id, text, callback) {
            this.emit(Room.ROOM_MESSAGE, [from_session_id, text]);

            return this.broadcast({
                type: Room.ROOM_MESSAGE,
                from: this.manager.get_user(from_session_id).get_username(),
                text: text
            }, null, callback);
        }
    });


    module.exports = Room;
/*
    var users = {
            "test-user-id-001" : "TEST01",
            "test-user-id-002" : "TEST02",
            "test-user-id-003" : "TEST03"
        },
        r = new Room(100, "test-room", "que pasa aki!!", {
            max_users: 2
        }, {}, {
            send: function () { console.log("send = ", arguments); },
            get_user_list: function (session_ids) {
                return ["TEST01", "TEST02"];
            },
            get_user: function(session_id) {
                return {
                    get_username: function () {
                        return users[session_id];
                    }
                }
            }
        });
    r.join("test-user-id-001");
    r.join("test-user-id-002");

    // full error
    r.join("test-user-id-003");

    r.message("test-user-id-002", "que ocurre akí chiwakita!!!");
    r.leave("test-user-id-002");
    console.log(r);
*/
}(module));

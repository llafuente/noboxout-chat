
module.exports = function(manager, io) {
    "use strict";

    // if the user connect we dont want to listen to this events at first...
    function when_user_join(user) {
        var socket = user.connection;

        socket.on("logout", function (data) {
            manager.user_leave(user.session_id);
        });

        socket.on("disconnect", function (data) {
            manager.user_leave(user.session_id);
        });

        socket.on("room:join", function (data) {
            if(!data.room_id) {
                console.log("invalid join:room packet =", data);
                return;
            }
            manager.room_join(user.session_id, data.room_id, function(err) {
                if(err) {
                    return socket.emit("error", {error: "join-room-refused", message: err.message});
                }
            });
        });

        socket.on("room:leave", function (data) {
            if(!data.room_id) {
                console.log("invalid leave:room packet =", data);
                return;
            }
            manager.room_leave(user.session_id, data.room_id);
        });

        socket.on("room:message", function (data) {
            if(!data.room_id || !data.text) {
                console.log("invalid room:message packet =", data);
                return;
            }
            manager.room_message(user.session_id, data.room_id, data.text);
        });

        socket.on("room:private", function (data) {
            if(!data.username) {
                console.log("invalid private packet =", data);
                return;
            }
            var tuser = manager.get_username(data.username);

            //if (!tuser || tuser.server_id !== user.server_id) {
            if (!tuser) {
                return socket.emit("error", {error: "user-is-not-online", message: ""});
            }

            var room_id;
            if (tuser.session_id.localeCompare(user.session_id) == 1) {
                room_id = tuser.server_id + "/" + tuser.session_id + "/" + user.session_id;
            } else {
                room_id = tuser.server_id + "/" + user.session_id + "/" + tuser.session_id;
            }

            manager.create_room(tuser.server_id, room_id, "tmp-room-001", "welcome to tmp room 01", {
                destroy_on_empty: true,
                is_public: false
            }, function(err, room_id) {
                if(err) {
                    return socket.emit("error", {error: "join-room-refused", message: err.message});
                } else {
                    manager.room_join(tuser.session_id, room_id);
                    manager.room_join(user.session_id, room_id);
                }
            });
        });
    }


    io.of("/chat")
        .on("connection", function (socket) {
            socket.on("login", function (data) {
                console.log("login in", data);
                if (!data.session_id || !data.server) {
                    console.log("invalid login packet =", data);
                    return;
                }

                manager.user_join(data.session_id, data.server, socket, function(err, user) {
                    if(!err) {
                        //socket.emit("login", {success:true});
                        return when_user_join(user);
                    }
                    socket.emit("error", {error: "conection-refused", message: err.message});
                    socket.disconnect();
                    console.log(err);
                });

            });

        });
};
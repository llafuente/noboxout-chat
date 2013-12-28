var Manager = require("../index.js").Manager,
    User = require("../index.js").User,
    Room = require("../index.js").Room,
    io = require("socket.io"),
    socketio_protocol = require("../index.js").SocketIO,
    memcache = require("memcache"),
    memcached,
    mgr;


// memcached configuration
// user is retrieved from memcached

function memcached_reconnect() {
    console.log("__memcached_reconnect", arguments);
    // no arguments - connection has been closed
    memcached.connect();
}

memcached = new memcache.Client(11211, "localhost");
memcached.on("close", memcached_reconnect);
memcached.on("end", memcached_reconnect);
memcached.on("timeout", memcached_reconnect);
memcached.on("error", memcached_reconnect);


User.Implements({
    load_userdata: function (callback) {
        console.log("get from memcached", this.session_id);
        memcached.get(this.session_id, function (err, result) {
            console.log("get from memcached", this.session_id, "result", arguments);
            if (err) {
                return callback(err);
            }

            if (!result) {
                return callback(new Error("session-not-found"));
            }

            var rjson;

            try {
                rjson = JSON.parse(result);
            } catch (parse_err) {
                return callback(parse_err);
            }

            this.userdata = rjson.data.userdata;
            callback();
        }.bind(this));
    },
    get_username: function () {
        return this.userdata.us_login;
    },
    relay_message: function (message, callback) {
        //console.log("#==> packet to ", this.session_id, JSON.stringify(message));

        this.connection.emit(message.type, message);

        setTimeout(callback, 500);
    },
    end_connection: function () {
        this.emit("end_connection", []);

        console.log("## ===> end connection ********");
    }
});


memcached.on("connect", function () {
    // no arguments - we"ve connected
    console.log("-- memcached is ready!");

    //only the first time, the rest is memcached going down...
    if (!mgr) {

        mgr = new Manager();

        mgr.create_server("s5", "test-server-01", "welcome to sever 5", {});
        mgr.create_room("s5", "global", "global", "welcome room global", {
            is_public: true,
            public_userlist: false,
            enter_notifications: false,
            leave_notifications: false
        });

        io = io.listen(8080);

        socketio_protocol(mgr, io);

        io.set("log level", 2);
        io.set("log color", true);


        mgr.on(Manager.USER_JOIN, function (user) {
            console.log("user-join", arguments);
            //by default join global room

            mgr.room_join(user.session_id, "global");
            if (user.userdata.us_tm_id) {
                var team_room_id = "team/" + user.userdata.us_tm_id;
                if (!mgr.get_server(user.server_id).get_room(team_room_id)) {
                    mgr.create_room(user.server_id, team_room_id, "alliance", "", {
                        requisites: function (session_id) {
                            return mgr.get_user(session_id).userdata.us_tm_id === user.userdata.us_tm_id;
                        }
                    });
                }
                mgr.room_join(user.session_id, team_room_id);
            }
        });
    }

});

memcached.connect();

// repl for JUST IN TIME DEBUG :)
// and set welcomes :)
var repl = require("repl").start("> ");

repl.context.mgr = mgr;
repl.context.io = io;

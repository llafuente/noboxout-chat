var tap = require("tap"),
    test = tap.test,
    users = {
        "test-user-id-001" : { name: "TEST01"},
        "test-user-id-002" : { name: "TEST02"},
        "test-user-id-003" : { name: "TEST03"}
    },
    Manager = require("../index.js").Manager,
    User = require("../index.js").User,
    Room = require("../index.js").Room,
    io = require("socket.io"),
    socketio_protocol = require("../index.js").SocketIO,
    io_client = require("socket.io-client"),
    io_client2,

    mgr,

    session_id1 = "test-user-id-001",
    session_id2 = "test-user-id-002",
    socket1,
    socket2,
    file;

// destroy cache in order to create a second client,
// nasty thing btw!

var name = require.resolve('socket.io-client');
delete require.cache[name];

io_client2 = require("socket.io-client");

// end of this thing


User.Implements({
    load_userdata: function (callback) {
        //here you need to call the callback with true if it's a valid user, false otherwise
        if (users[this.session_id]) {
            this.userdata = users[this.session_id];
            this.emit("load_userdata", [this.userdata]);
            callback(null);
        } else {
            callback(new Error("invalid-sessionid"));
        }
    },
    get_username: function () {
        return this.userdata.name;
    },
    relay_message: function (message, callback) {
        //console.log("#->message", this.session_id, JSON.stringify(message));

        this.connection.emit(message.type, message);

        setTimeout(callback, 500);
    },
    end_connection: function () {
        this.emit("end_connection", []);

        //console.log("## ===> end connection ********");
    }
});



test("create manager & listen", function (t) {
    console.log("\n\n");
    mgr = new Manager();

    mgr.create_server("s5", "test-server-01", "welcome to test sever 01", {});
    mgr.create_room("s5", "global", "test-room-001", "welcome room 01", {});

    io = io.listen(8080);

    socketio_protocol(mgr, io);


    io.enable("browser client minification");  // send minified client
    io.enable("browser client gzip");          // gzip the file

    io.set("log level", 5);
    io.set("log color", true);

    t.end();
});

test("create client", function (t) {
    console.log("\n\n");

    var end_wrap = (function() { t.end(); }).after(2);

    socket1 = io_client.connect('http://localhost:8080/chat');

    socket2 = io_client2.connect('http://localhost:8080/chat');

    socket1.on('connect', function() {
        end_wrap();
    });
    socket2.on('connect', function() {
        end_wrap();
    });

});

test("send session_id", function (t) {
    console.log("\n\n");

    var end_wrap = (function() { t.end(); }).after(2);

    socket1.on("server:join", function(data) {
        t.equal(data.success, true, "user1 login successfully");

        end_wrap();
    });

    socket2.on("server:join", function(data) {
        t.equal(data.success, true, "user2 login successfully");

        end_wrap();
    });

    socket1.emit("login", {session_id: session_id1, server: "s5"});
    socket2.emit("login", {session_id: session_id2, server: "s5"});
});

test("users join", function (t) {
    console.log("\n\n");

    var end_wrap = (function() { t.end(); }).after(2);

    socket1.once("room:join", function(data) {
        t.equal(data.room_id, "global", "user1 join global room");

        end_wrap();
    });

    socket2.once("room:join", function(data) {
        t.equal(data.room_id, "global", "user2 join global room");

        end_wrap();
    });

    socket1.emit("room:join", {room_id: "global"});
    socket2.emit("room:join", {room_id: "global"});
});

test("user1 private to user2", function (t) {
    console.log("\n\n");

    var end_wrap = (function() { t.end(); }).after(2);

    socket1.once("room:join", function(data) {
        t.equal(data.room_id, "s5/test-user-id-002/test-user-id-001", "user1 join! check room name");

        end_wrap();
    });

    socket2.once("room:join", function(data) {
        t.equal(data.room_id, "s5/test-user-id-002/test-user-id-001", "user2 join! check room name");
        end_wrap();
    });

    socket1.emit("room:private", {username: "TEST02"});
});

test("user2 private to user1 (error)", function (t) {
    console.log("\n\n");

    socket2.once("error", function(data) {
        console.log("error!!", data);

        t.equal(data.message, "room-exists", "check room name");

        t.end();
    });

    socket2.emit("room:private", {username: "TEST01"});
});

test("user2 speaks in the private", function (t) {
    console.log("\n\n");

    var end_wrap = (function() { t.end(); }).after(2);

    socket1.once("room:message", function(data) {
        console.log("error!!", data);

        t.equal(data.text, "testme!", "message text");
        t.equal(data.room_id, "s5/test-user-id-002/test-user-id-001", "room id");

        end_wrap();
    });

    socket2.once("room:message", function(data) {
        console.log("error!!", data);

        t.equal(data.text, "testme!", "message text");
        t.equal(data.room_id, "s5/test-user-id-002/test-user-id-001", "room id");

        end_wrap();
    });

    socket2.emit("room:message", {room_id: "s5/test-user-id-002/test-user-id-001", text: "testme!"});
});





test("close socket-io", function (t) {
    console.log("\n\n");

    // We should keep a reference to every open socket and kill them here.
    // process.exit is fastest ^^
    io.server.close();

    setTimeout(function() {
        process.exit(1);
    }, 500);

    t.end();
});



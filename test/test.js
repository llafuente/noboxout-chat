var Fun = require("function-enhancements"),
    tap = require("tap"),
    test = tap.test,
    users = {
        "test-user-id-001" : { name: "TEST01"},
        "test-user-id-002" : { name: "TEST02"},
        "test-user-id-003" : { name: "TEST03"}
    },
    Manager = require("../index.js").Manager,
    User = require("../index.js").User,
    Room = require("../index.js").Room,
    mgr,

    session_id1 = "test-user-id-001",
    session_id2 = "test-user-id-002";

User.method("load_userdata", function (callback) {
    //here you need to call the callback with true if it's a valid user, false otherwise
    if (users[this.session_id]) {
        this.userdata = users[this.session_id];
        this.emit("load_userdata", [this.userdata]);
        callback(null);
    } else {
        callback(new Error("invalid-sessionid"));
    }
});

User.method("get_username", function () {
    return this.userdata.name;
});

User.method("relay_message", function (message, callback) {
    //console.log("#relay_message", this.session_id, message);

    this.emit("relay_message", [message]);

    setTimeout(callback, 500);
});

User.method("end_connection", function () {
    this.emit("end_connection", []);

    console.log("## ===> end connection ********");

});

test("create manager", function (t) {
    console.log("\n-----------------\n");
    mgr = new Manager();

    t.end();
});

test("create server", function (t) {
    mgr.create_server(1, "test-server-01", "welcome to test sever 01", {});

    t.ok(mgr.get_server(1) !== null, "server(1) is not null");

    t.end();
});

test("create rooms", function (t) {
    console.log("\n-----------------\n");
    mgr.create_room(1, 1, "test-room-001", "welcome room 01", {});
    mgr.create_room(1, 2, "test-room-002", "welcome room 02", {});

    t.equal(mgr.get_server(1).get_room(1) !== null, true, "room(1:1) is not null");
    t.equal(mgr.get_server(1).get_room(2) !== null, true, "room(1:2) is not null");

    t.end();
});



test("user1 join server:1", function (t) {
    console.log("\n-----------------\n");
    mgr.user_join(session_id1, 1, null, function(err, user) {
        if(!err) {
            t.equal(mgr.get_user(session_id1) !== null, true, "user@mgr is not null");
            t.equal(mgr.get_server(1).has_user(session_id1), true, "user@server is not null");

            return t.end();
        }
        throw err;
    });
});


test("user2 join server:1", function (t) {
    console.log("\n-----------------\n");
    mgr.user_join(session_id2, 1, null, function(err, user) {
        if(!err) {
            t.equal(mgr.get_user(session_id2) !== null, true, "user@mgr is not null");
            t.equal(mgr.get_server(1).has_user(session_id2), true, "user@server is not null");

            return t.end();
        }
        throw err;
    });
});
test("user unkown join server:1", function (t) {
    console.log("\n-----------------\n");
    mgr.user_join("this-not-exists", 1, null, function(err, user) {
        if(err) {
            t.equal(err.message, "userdata-retrieval-failed", "userdata-retrieval-failed");

            return t.end();
        }
        throw new Error("this should give an error");
    });


});

test("user1 join room 1:1", function (t) {
    console.log("\n-----------------\n");
    mgr.room_join(session_id1, 1, function(err, user) {
        if(!err) {
            return t.end();
        }
        throw err;
    });

});

test("user2 join room 1:1 ", function (t) {
    console.log("\n-----------------\n");
    var end_wrap = Fun.after(function() { console.log("xxx"); t.end(); }, 5);

    var user1 = mgr.get_user(session_id1),
        user2 = mgr.get_user(session_id2);


    var test_messages =[],
    i = 2;
    while(i--) {
        test_messages.push(function(message) {

            if (message.type === Room.ROOM_UPDATE) {
                t.equal(message.type, Room.ROOM_UPDATE, "message type is update");
                t.equal(message.users.length, 2, "two in the room");
                console.log("@@ room updated for user1");
                end_wrap();
            }

            if (message.type === Room.ROOM_JOIN) {
                t.equal(message.type, Room.ROOM_JOIN, "join success");
                console.log("@@ join received");
                end_wrap();
            }
        });
    }


    user1.on("relay_message", test_messages[0], false, 2);
    user2.on("relay_message", test_messages[1], false, 2);

    mgr.room_join(session_id2, 1, function(err, user) {
        if(!err) {
            console.log("@@ join successful");
            return end_wrap();
        }
        throw err;
    });
});


test("user1 leave room 1:1 ", function (t) {
    console.log("\n-----------------\n");
    var end_wrap = Fun.after(function() { console.log("xxx"); t.end(); }, 3);

    var user1 = mgr.get_user(session_id1),
        user2 = mgr.get_user(session_id2);

    var test_messages = function(message) {

        if (message.type === Room.ROOM_UPDATE) {
            t.equal(message.type, Room.ROOM_UPDATE, "message type is update");
            t.equal(message.users.length, 1, "I am alone in the room");
            console.log("@@ room updated for user1");
            end_wrap();
        }

        if (message.type === Room.ROOM_LEAVE) {
            t.equal(message.type, Room.ROOM_LEAVE, "leave success");
            console.log("@@ join received");
            end_wrap();
        }
    };

    user2.on("relay_message", test_messages, false, 2);

    mgr.room_leave(session_id1, 1, function(err, user) {
        if(!err) {
            console.log("@@ leave successful");
            return end_wrap();
        }
        throw err;
    });
});


test("user2 leave room 1:1 ", function (t) {
    console.log("\n-----------------\n");
    var end_wrap = Fun.after(function() { console.log("xxx"); t.end(); }, 1);

    var user1 = mgr.get_user(session_id1),
        user2 = mgr.get_user(session_id2);

    mgr.room_leave(session_id1, 1, function(err, user) {
        if(!err) {
            console.log("@@ leave successful");
            return end_wrap();
        }
        throw err;
    });
});

test("room 1:1 still exists", function (t) {
    t.equal(mgr.get_server(1).get_room(1) !== null, true, "room(1:1) is not null");
    t.end();
});

test("create a temporary room", function (t) {
    mgr.create_room(1, 3, "tmp-room-001", "welcome to tmp room 01", {
        destroy_on_empty: true,
        is_public: false
    });
    t.end();
});

test("create a temporary room", function (t) {
    console.log(mgr.get_server(1).get_list());
    t.end();
});

test("room 1:3 exists", function (t) {
    console.log(mgr.get_server(1).get_room(3));

    t.equal(mgr.get_server(1).get_room(3) !== null, true, "room(1:3) is not null");
    t.equal(mgr.get_server(1).get_room(3).perms.destroy_on_empty, true, "room(1:3) destroy_on_empty=true");
    t.end();
});

test("user1 enter room 1:3", function (t) {
    console.log("\n-----------------\n");

    var user1 = mgr.get_user(session_id1),
        user2 = mgr.get_user(session_id2);

    mgr.room_join(session_id1, 3, function(err, user) {
        if(!err) {
            console.log("@@ join successful");
            return t.end();
        }
        throw err;
    });
});

test("user1 leave room 1:3", function (t) {
    console.log("\n-----------------\n");

    var user1 = mgr.get_user(session_id1),
        user2 = mgr.get_user(session_id2);

    mgr.room_leave(session_id1, 3, function(err, user) {
        if(!err) {
            console.log("@@ leave successful");
            return t.end();
        }
        throw err;
    });
});

test("room 1:3 should be destroyed", function (t) {
    console.log(mgr.get_server(1).get_room(3));

    t.equal(mgr.get_server(1).get_room(3) === null, true, "room(1:3) is null");
    t.end();
});


module.exports = {
    messages: {
        es: {
            "user-leave": "{date}# {user} ha abandonado el canal.",
            "user-join": "{date}# {user} ha acaba de entrar.",
            "room-full": "{date} [{user}] No puede entrar, el canal está lleno.",
            "user-message": "{date} [{user}] {message}.",
            "server-welcome" : "{date} [Bot] {message}.",
            "room-welcome" : "{date} [@{room}] {message}.",
            "global_room" : "Sala pública"
        }
    },
    locale: "es",
    get: function (lang) {
    console.log("===> lang", lang);
        var messages = module.exports.messages[module.exports.locale],
            rid,
            lng = messages[lang.id],
            replacers,
            r;

        if (!lng) {
            throw new Error("lang_id[" + lang.id + "] not found");
        }

        replacers = lang.params || {};
        for (rid in replacers) {
            r = new RegExp('{' + rid + '}', "g");
            //console.log(rid, replacers[rid], r);
            lng = lng.replace(r, replacers[rid]);
        }

        return lng;

    }
};

/*
console.log(module.exports.get({id: "user-leave"}));
console.log(module.exports.get({id: "user-leave", params: {date: "XXXX-XX-XX", user: "user", "room": "habitat"}}));
*/
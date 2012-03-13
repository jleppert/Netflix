var NodeFlix = require('nodeflix');

var Netflix = new NodeFlix({
    consumer_key:           '',
    consumer_secret:        '',
    access_token:           '',
    access_token_secret:    ''
});

NetFlix.get('catalog/titles', { term: 'Star Trek: Voyager' }).end(function(data) {
    console.log(data);
});

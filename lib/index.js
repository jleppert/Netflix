var nodeflix = require('./nodeflix');

var n = new nodeflix({
    consumer_key: '',
    consumer_secret: '',
    oauth_token: '',
    oauth_token_secret: '',
    user_id: ''
});

n.get('/users/:user_id', function(doc) {
    console.log(this.document);
});

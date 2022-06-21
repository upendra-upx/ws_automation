console.log('Inside Worker');

self.addEventListener('fetch', event => {
  console.log(event);
})

onmessage = function(param) {
    var uri_value = 'https://wa.me/' + param.data[0] + '?text=' + param.data[1];
    var url_encoded = encodeURI(uri_value);
  this.fetch(url_encoded,
    {
      //method: 'GET',
      //mode: 'no-cors'
    }
    ).then((response) => {
    if (!response.ok) {
      //throw new Error(`HTTP error! Status: ${ response.status }`);
      console.log('Request error! Status:' + response.status);
    }
    else  { 
      postMessage('Success');
      console.log('Request success. Status:' + response.status);
    }
  });

};
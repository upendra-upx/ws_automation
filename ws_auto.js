window.onload=function() {
  document.getElementById("msg_ip_btn").addEventListener("click", SendMsg);

}

var w;

function SendMsg()
{

    var status_text_new = document.getElementById("status_text");
    var status_text_old = document.getElementById("status_text");
    var status_div = document.getElementById("status_msg");   

    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
          w = new Worker("send_msg.js");
        }
        w.onmessage = function(event) {

            status_text_new.value ="Sent Succesfully!";        
            status_div.replaceChild(status_text_new, status_text_old);

        };

        var contact = document.getElementById("contact").value;
        var message_val = document.getElementById("message").value;
        w.postMessage([contact, message_val]);
        console.log('Message posted to worker');

      } else {
        status_text_new.value ="No Worker Support!";        
        status_div.replaceChild(status_text_new, status_text_old);
      }

    
}

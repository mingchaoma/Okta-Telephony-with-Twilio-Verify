exports.handler = function(context, event, callback) {

    const auth_secret=event.request.headers.auth_secret;
    if (context.auth_secret!==auth_secret) {
      //fail API authentication, return an error
      const errorResponse={
                      "error":{
                        "errorSummary":"authentication failed",
                        "errorCauses":[
                          {
                            "errorSummary":"authentication failed",
                            "reason":"authentication failed",
                            "location":""
                          }
                        ]
                      }
                      }
      console.log(errorResponse);
      callback(errorResponse);
    } else {

    const verify_sid=context.VERIFY_SID;
    console.log(event.request.headers);

    var channel=event.data.messageProfile.deliveryChannel.toLowerCase()==='sms'?'sms':'call'; //SMS or voice call
    var to=event.data.messageProfile.phoneNumber;
    var code=event.data.messageProfile.otpCode;
    
    var client=context.getTwilioClient();

    //call Verify API
    client.verify.v2.services(verify_sid)
        .verifications
        .create({
            to:to,
            channel:channel,
            customCode:code,
            })
        .then((verification) => {
            console.log(verification);
            console.log(verification.sendCodeAttempts);

            const response={
                  "commands":[
                    {
                      "type":"com.okta.telephony.action",
                      "value":[
                        {
                          "status":"SUCCESSFUL",
                          "provider":"Twilio Verify",
                          "transactionId":verification.sid,
                          "transactionMetadata":verification.sendCodeAttempts.at(-1).attempt_sid
                        }
                      ]
                    }
                  ]
                }

            callback(null, response);
            })
        .catch ((error)=>{
            console.log ("Error is : " + error);
            const errorResponse={
                                  "error":{
                                    "errorSummary":error.message,
                                    "errorCauses":[
                                      {
                                        "errorSummary":error.status,
                                        "reason":error.moreInfo,
                                        "location":""
                                      }
                                    ]
                                  }
                                  }
            callback(errorResponse);
        })
    }
    
};

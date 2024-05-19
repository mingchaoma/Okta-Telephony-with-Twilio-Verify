
exports.handler = function(context, event, callback) {

    const verify_sid=context.VERIFY_SID;
    
    var channel=event.data.messageProfile.deliveryChannel.toLowerCase()==='sms'?'sms':'call'; //SMS or voice call
    var to=event.data.messageProfile.phoneNumber;
    var code=event.data.messageProfile.otpCode;

    console.log("To phone number is " + to);
    
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
    
};

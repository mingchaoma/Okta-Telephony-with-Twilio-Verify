exports.handler = async function(context, event, callback) {
try {
    
    if (context.auth_secret !== event.request.headers.auth_secret) {
      throw new Error("Authentication failed");
    }
    const oktaBaseUrl = context.okta_org_baseurl;
    const api_token= context.okta_auth_token;
    //one off check when enable Okta event inline hook, required by Okta
    const verificationValue = event.request?.headers ? event.request.headers['x-okta-verification-challenge'] : null;
    if (verificationValue) {
        console.log("Verifying");
        // Prepare response body
        const responseBody = { verification: verificationValue };
        // Return success response
        callback(null, JSON.stringify(responseBody));
    }
    
    console.log ("event data: ",event.data);
    let mfa_event= event.data?.events[0];
    console.log ("mfa_event: ", mfa_event);
    let channel=null;
    //check payload of "user.authentication.auth_via_mfa" and "user.mfa.factor.activate" for SMS OTP and CALL OTP
    if (mfa_event && mfa_event.outcome?.result === 'SUCCESS'  && (mfa_event.debugContext?.debugData?.factor === 'SMS_FACTOR' || mfa_event.outcome?.reason.includes("SMS_FACTOR"))) 
    {channel="sms"} //SMS OTP is used
    else if   (mfa_event && mfa_event.outcome?.result === 'SUCCESS'  && (mfa_event.debugContext?.debugData?.factor === 'CALL_FACTOR' ||mfa_event.outcome?.reason.includes("CALL_FACTOR"))) 
    {channel="call"} //call OTP is used

    if (channel!==null)
    {
    const userid=mfa_event.actor?.id;//grab user id
    const okta=require('@okta/okta-sdk-nodejs');
    const OktaClient= new okta.Client({ orgUrl: oktaBaseUrl, token: api_token });
    let phone_number=null;
    //get the list of enrolled factors (such as sms, call etc)
    const factors= await OktaClient.userFactorApi.listFactors({ userId: userid });

    for await (const factor of factors){

      //in Okta, user can enroll different phone numbers for SMS factor and call factor respectively, thus have to grab the phone number based on the actual factor used in MFA
      if (factor.factorType===channel) {
         phone_number=factor.profile.phoneNumber;
          console.log ("MFA factor is:", channel);
          console.log ("MFA phone number is:", phone_number);
      }
    }
    if (phone_number===null) {
            console.log ("can't retrieve phone number, possible not SMS OTP or Voice OTP MFA factor")
        return callback (null, "can't retrieve phone number, possible not SMS OTP or Voice OTP MFA factor")
    }
    
   //call Verify feedback API using phone number
    let client = context.getTwilioClient();
    let verification=await client.verify.v2.services(context.VERIFY_SID)
        .verifications(phone_number).update({status: 'approved'});
    
    console.log (verification);
    return callback (null,verification);
    
    }else {
        console.log ("not SMS OTP or Voice OTP MFA factor")
        return callback (null, "not SMS OTP or Voice OTP MFA factor")
    }

}catch (error){

    console.error(error);
    return callback(null, error);

}

};

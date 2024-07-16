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

    //check payload of "user.authentication.auth_via_mfa" and "user.mfa.factor.activate" for SMS OTP and CALL OTP
    if (mfa_event && mfa_event.outcome?.result === 'SUCCESS'  && (mfa_event.debugContext?.debugData?.factor === 'SMS_FACTOR' || mfa_event.debugContext?.debugData?.factor === 'CALL_FACTOR') || (mfa_event.outcome?.reason.includes("SMS_FACTOR") ||mfa_event.outcome?.reason.includes("CALL_FACTOR")))
    {
    //call Okta user API with user id to get the phone number, which will be used when calling Twilio Verify feedback API
    const userid=mfa_event.actor?.id;//grab user id
    const okta=require('@okta/okta-sdk-nodejs');
    const OktaClient= new okta.Client({ orgUrl: oktaBaseUrl, token: api_token });
    let user = await OktaClient.userApi.getUser({ userId: userid }); //call Okta user API
    const phone_number=user.profile.mobilePhone.replace(/\s+/g, ''); //grab phone numberand remove space in between
    console.log ("user phone number: ", phone_number);
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

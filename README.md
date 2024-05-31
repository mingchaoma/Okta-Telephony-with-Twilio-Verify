
Note: for detail step-by-step instruction, please read [this blog post](https://www.twilio.com/en-us/blog/okta-byot-verify)

# Okta-Telephony-with-Twilio-Verify
Okta has made an [announcement](https://support.okta.com/help/s/article/bring-your-own-telephony-required-for-sms-and-voice) that from 15th Sep. 2024 all customers must bring their own telephony provider via Okta Telephony Inline Hook in order to coninute to send SMS and Voice OTP for both MFA and non-MFA use case (authentication, account unlock and password reset). 

This project will show you how to setup Okta telephony inline hook to use [Twilio Verify](https://www.twilio.com/docs/verify/api) as the telephony provider. It supports both SMS and voice channels. 

Twilio Verify is a dedicated, fully managed, turn-key [omnichannel](https://www.twilio.com/docs/verify/authentication-channels) verification solution. 

## Pre-requisites
* Okta account
* A Twilio Verify Service. [Create one in the Twilio Console](https://www.twilio.com/console/verify/services). Don't have a Twilio account, [signup for free](https://www.twilio.com/try-twilio)!

## Setup Twilio Verify and Twilio Function
### Setup Twilio Verify
Pleae follow [this link](https://www.twilio.com/console/verify/services) to create a new Verify service. Note down the Verify Service SID, a long string start with VA (VAxxxxxxxxx......)
Please [contact Twilio Sales](https://www.twilio.com/help/sales) to enable custom code feature for above Verify service. 
### Setup Twilio Function as the external telephony service provider for Okta
[Twilio Functions](https://www.twilio.com/docs/runtime/functions) is a serverless environment that empowers developers to quickly and easily create production-grade, event-driven Twilio applications that scale with their businesses.
1. [Create a new service](https://www.twilio.com/docs/runtime/functions/create-service), call it Okta (or anything you like).
2. Add a [new function](https://www.twilio.com/docs/runtime/functions/functions-editor) and give it a name, for example, Okta_MFA. 
3. Change the function's visibility from [protected to public](https://www.twilio.com/docs/runtime/functions-assets-api/api/understanding-visibility-public-private-and-protected-functions-and-assets).
4. Copy the code from [this repo](https://github.com/mingchaoma/Okta-Telephony-with-Twilio-Verify/blob/main/functions/Okta_Twilio_Verify.js) to your function Okta_MFA and save it.
5. Setup the following [Environment variables](https://www.twilio.com/docs/runtime/functions/variables).

Variable | Value 
--- | --- 
`VERIFY_SID`| VAxxxxxxxxx (the Verify service that you created at previous steps) 
`auth_secret`| please create a random string and note it down, this will be used to authenticate the API call from Okta 

6. Save and Deploy
7. Take a note of your Twilio Function URL, in this example, it will be something like https://Okta-xxxx.twil.io/Okta_MFA. This is the URL that you will use when setting up the Okta telephony inline hook

## Config Okta Telephony Inline Hook
Both Okta Classic Engine and Identity Engine support telephony inline hook, the solution and code shared in this project works for both cases. For Classic Engine please follow [this instruction](https://help.okta.com/en-us/content/topics/telephony/telephony-how-to-tasks.htm) and for Identity Engine, please follow [this instruction](https://help.okta.com/oie/en-us/content/topics/telephony/telephony-how-to-tasks.htm). 

### Add a telephony inline hook (Okta Classic Engine) 
The following steps explain how to use Okta API to configure telephony inline hook. Alternatively you can also use Okta Workflow, detailed [here](https://help.okta.com/en-us/content/topics/telephony/workflows-for-telephony.htm)

1. Login Okta as admin and switch to Admin Console, go to Workflow => Inline Hooks
2. Click Add Inline Hook, and then select Telephony in the drop down
3. Configure the following options
   * Name: give it a name, for example, Twilio Verify
   * URL: this is the URL of the Twilio Function that you created above (https://Okta-xxxx.twil.io/Okta_MFA)
   * Authentication field: auth_secret
   * Authentication secret: the random string that you created when creating the Twilio function (the value of auth_secret)
   * Custom Headers: add any custom header (in our case, we do not use any custom header)
4. Click Save and make sure the telephony inline hook is in active status

Please note: the Authentication field and Autehntication secret will be used to authenticate the API call from Okta. Make sure that they are matched with the key/value pair created in Twilio Function.

### Test the telephony inline hook (Okta Classic Engine) 
1. In Inline Hooks, find the Active telephony inline hook and click Actions Preview. The Preview tab of the inline hook opens.
2. In the tab, go to Configure inline hook request and enter a user's information for testing:
  * data.userProfile: Enter the primary email address of a user.
  * requestType: From the dropdown menu, select one of the following events to send the SMS text or voice call to the user: MFA enrollment, MFA verification, Account unlock, or Password reset.
  * In Preview example inline hook request, click Generate request. This generates the JSON request that Okta sends to the Twilio Function.
  * Click Edit to edit the generated request, replace the phone number (9876543f21) with a mobile number.
  * In View service's response, click View response. The mobile number that you provide will receive a SMS OTP (in this case it will be 1111 unless you modified it)

Depending on your requirement and use cases (such as MFA, account recovery and/or account unlock), you will need to configure Okta password policy for account recovery (forgot password) and account unlock. To enforce MFA for login, you need to enable Multifactor (SMS and or Voice), configure factor enrollment policy and create sign on policy that requires MFA. 


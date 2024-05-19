# Okta-Telephony-with-Twilio-Verify

## Pre-requisites
* Okta account
* A Twilio Verify Service. [Create one in the TWilio Console](https://www.twilio.com/console/verify/services). Don't have a Twilio account, [signup free](https://www.twilio.com/try-twilio)!

## Setup Twilio Verify and Twilio Function
### Setup Twilio Verify
Pleae follow [this link](https://www.twilio.com/console/verify/services) to create a new Verify service. Note down the Verify service SID, a long string start with VA (VAxxxxxxxxx......)
Please [contact Twilio Sales](https://www.twilio.com/help/sales) to enable custom code feature for above Verify service. 
### Setup Twilio Function as the external telephony service provider for Okta
[Twilio Functions](https://www.twilio.com/docs/runtime/functions) is a serverless environment that empowers developers to quickly and easily create production-grade, event-driven Twilio applications that scale with their businesses.
1. [Create a new service](https://www.twilio.com/docs/runtime/functions/create-service), called it Okta (or anything you like)
2. Add a [new function](https://www.twilio.com/docs/runtime/functions/functions-editor) and give it a name, for example, Okta_MFA. 
3. Change the function's visibility from [protected to public](https://www.twilio.com/docs/runtime/functions-assets-api/api/understanding-visibility-public-private-and-protected-functions-and-assets)
4. Copy the code from [this repo](https://github.com/mingchaoma/Okta-Telephony-with-Twilio-Verify/blob/main/functions/Okta_Twilio_Verify.js) to your function Okta_MFA and save it
5. Setup following [Environment variables](https://www.twilio.com/docs/runtime/functions/variables)

Variable | Value 
--- | --- 
`VERIFY_SID`| VAxxxxxxxxx (the Verify service that you created at previous steps) 
6. Save and Deploy
7. Take a note of your Twilio Function URL, in this example, it will be something like https://Okta-xxxx.twil.io/Okta_MFA. This is the URL that you will use when setting up the custom SMS gateway

## Config Okta Telephony Inline Hook

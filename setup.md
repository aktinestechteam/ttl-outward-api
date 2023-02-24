# Setting up Mongo DB
1. db.awb.createIndex({awb_no: 1}, {unique: true})
2. db.booklist.createIndex({booklist_id: 1}, {unique: true})
3. db.ccaapproval.createIndex({cca_no: 1}, {unique: true})
4. db.email.createIndex({msg_id: 1}, {unique: true})
5. db.reason.createIndex({code: 1}, {unique: true})
6. db.settings.createIndex({key: 1}, {unique: true})
7. db.shc.createIndex({code: 1}, {unique: true})
8. db.station.createIndex({iata: 1}, {unique: true})

db.agent.createIndex({billing_code: 1}, {unique: true});
db.awb.createIndex({awb_no: 1}, {unique: true}); 
db.booklist.createIndex({booklist_id: 1}, {unique: true}); 
db.ccaapproval.createIndex({cca_no: 1}, {unique: true}); 
db.email.createIndex({msg_id: 1}, {unique: true}); 
db.lockedoperation.createIndex({username: 1}, {unique: true});
db.lockedoperation.createIndex({operationId: 1}, {unique: true});
db.reason.createIndex({code: 1}, {unique: true}); 
db.settings.createIndex({key: 1}, {unique: true});
db.shc.createIndex({code: 1}, {unique: true}); 
db.station.createIndex({iata: 1}, {unique: true}); 
db.awbclaim.createIndex({awb_no: 1}, {unique: true});
db.tempuser.createIndex({username: 1}, {unique: true});
db.tempuser.createIndex({email: 1}, {unique: true});


# Clear Mongo
db.attachment.drop();
db.awb.drop();
db.awbclaim.drop();
db.awbinfo.drop();
db.awbleg.drop();
db.awblegop.drop();
db.awbquery.drop();
db.awbquerycomment.drop();
db.booklist.drop();
db.ccaapproval.drop();
db.ccarequest.drop();
db.email.drop();
db.lockedoperation.drop();

# Free CR
0. React + Socket = Realtime
1. RCS
2. AWB History
3. Re-schedule of the cargo from the booklist directly
4. Booklist vs EGM preview
5. CCA Reason Set & Reports according to the same
6. Moving FDC into Central Ops
7. Change of Destination of an AWB
8. Independently raising CCA by the central finance
9. RMS & RMS-HUB Review

---
# Files updated with logs
- AWBController
- BooklistController.js
- ClaimController.js
- FlightsController.js
- OperationsController.js
- DepartedController.js
- FDCController.js
- LockUnlockController.js
- RCController.js

COMMANDS
--------
db.awbinfo.find({awb_no: ""})
db.awbinfo.update({awb_no: ""}, {$set: {}})
db.awbinfo.update({_id: ObjectId("")}, {$set: {}})

db.awbleg.find({awb_no: ""})
db.awbleg.find({awb_no: ""}, {status: 1, pieces: 1, weight: 1, from: 1})
db.awbleg.find({_id: ObjectId("")})
db.awbleg.update({_id: ObjectId("")}, {$set: {}})

db.awbleg.find({booklist: ObjectId("")})
db.awbleg.updateMany({booklist: ObjectId(""), status: "COMPLETED", void_on: 0, }, {$set: {actual_pieces_flown: 0, actual_weight_flown: 0, status: "PENDING"}})

db.booklist.find({station: ""})

ddd MMM DD HH:mm:ss YYYY

EMAIL SETUP
-----------
https://docs.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth#register-your-application

https://docs.microsoft.com/en-us/graph/auth-v2-user

https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?client_id=328ff087-8f08-41d4-b71b-8b368174cd14&response_type=code&response_mode=query&scope=https:%20%20outlook.office.com%20IMAP.AccessAsUser.All



# Construct The URL below using tenant & client_id values received from the admin.
https://login.microsoftonline.com/328ff087-8f0d-41d4-b71b-8b368174cd14/oauth2/v2.0/authorize?client_id=329f8b37-b8b0-4fd7-b262-d676d0b7ee7d&response_type=code&response_mode=query&scope=IMAP.AccessAsUser.All

# Once you call and complete the flow by executing the above URL, you will get the below mentioned URL being called upon eventually. You need to read the code value from it.
https://capsbackend.ttgroupglobal.com/?code=0.AVQAh_CPMg2P1EG3G4s2gXTNFDeLnzKwuNdPsmLWdtC37n1UACc.AgABAAIAAAD--DLA3VO7QrddgJg7WevrAgDs_wQA9P_O9gwrdAdGo9tHuDfQErec9k77U7YRU-rlT1GaUMEKHUGA_hSkS_aehkJA65JBA5dsJAzw_0A6SAaO3O0c3v7qXCSEUvxys4orGXyU9SZ5bn0nVtNhUkmm_h2dZGHUZc5ZbSJYhXURDf1s3CJkD31-ww-N7iXsRPpG8RCdofE9WOYckMAux-thwORoZBN8H60eMQPtjt7imgIQVMgHQJjcuaxhXKOaIqxQ7fE1tUAmRxK2eJDqC3itOdfz7l8WOJvO17Rcxmlj7Z96bcPcogpncWc6YSpltF8zHvxbE8bkeVTQgDVDaJ3SL8YUg9MQOIvjRDbTt_YoJnYF-x9gxPoJH4LzsOty7CzY8Wo1cK5IKLANXlfckrZmYpZ78pUZM7jAV8EX5x3SHS6opCi0ydzIX6mChJG1P-YP2JPJ3hjAu-cDBj-upC8jRGAYqYId-eT135KqWml4Ca12aPgypmiOHjgC5OejNHoyLljRxL8nX3YEAeMCFtEVd6TFVDsGbioCntzVHEZ6yBMKgWNvpgqiw4thf9sZS_NskHi7gPNRBE33RFaCpPFRO13n0oI8Dq7DynwNlrj1BH9CLuAcKjek_YUYs17NigIrEGKgqMUoK6JxltlQcJXdF96hUfftZqo4qJhEl1GLvjINqDMriZARHyybuwHboA&session_state=5393668c-db7b-4bc1-8180-879b2a1b6bfe#

Using the theme get a token as mentioned on https://docs.microsoft.com/en-us/graph/auth-v2-user
The response will be access token which you need to use in next step.

# construct a string as mentioned below using the code and place this in the IMAP initialization construct for xoauth2 variable. https://www.npmjs.com/package/node-imap 
base64("user=" + userName + "^Aauth=Bearer " + accessToken + "^A^A")
user=central@ttgroupglobal.com^Aauth=Bearer 0.AVQAh_CPMg2P1EG3G4s2gXTNFDeLnzKwuNdPsmLWdtC37n1UACc.AgABAAIAAAD--DLA3VO7QrddgJg7WevrAgDs_wQA9P_O9gwrdAdGo9tHuDfQErec9k77U7YRU-rlT1GaUMEKHUGA_hSkS_aehkJA65JBA5dsJAzw_0A6SAaO3O0c3v7qXCSEUvxys4orGXyU9SZ5bn0nVtNhUkmm_h2dZGHUZc5ZbSJYhXURDf1s3CJkD31-ww-N7iXsRPpG8RCdofE9WOYckMAux-thwORoZBN8H60eMQPtjt7imgIQVMgHQJjcuaxhXKOaIqxQ7fE1tUAmRxK2eJDqC3itOdfz7l8WOJvO17Rcxmlj7Z96bcPcogpncWc6YSpltF8zHvxbE8bkeVTQgDVDaJ3SL8YUg9MQOIvjRDbTt_YoJnYF-x9gxPoJH4LzsOty7CzY8Wo1cK5IKLANXlfckrZmYpZ78pUZM7jAV8EX5x3SHS6opCi0ydzIX6mChJG1P-YP2JPJ3hjAu-cDBj-upC8jRGAYqYId-eT135KqWml4Ca12aPgypmiOHjgC5OejNHoyLljRxL8nX3YEAeMCFtEVd6TFVDsGbioCntzVHEZ6yBMKgWNvpgqiw4thf9sZS_NskHi7gPNRBE33RFaCpPFRO13n0oI8Dq7DynwNlrj1BH9CLuAcKjek_YUYs17NigIrEGKgqMUoK6JxltlQcJXdF96hUfftZqo4qJhEl1GLvjINqDMriZARHyybuwHboA^A^A

------------------
STEP 1
https://login.microsoftonline.com/87933f73-47a5-4eb5-9263-c9ea0ac31b03/oauth2/v2.0/authorize?client_id=a94f11ec-365e-4208-ace4-c31c35506f73&response_type=code&response_mode=query&scope=IMAP.AccessAsUser.All

STEP 2 - READ code value and use it in below request
$.post('https://login.microsoftonline.com/87933f73-47a5-4eb5-9263-c9ea0ac31b03/oauth2/v2.0/token', "client_secret=wWH8Q~9LBekBD9KyDn2.ant371w.7-kIBtliYbjT&client_id=a94f11ec-365e-4208-ace4-c31c35506f73&scope=user.read%20mail.read&redirect_uri=https://uatbackend.ttgroupglobal.com/redirect&grant_type=authorization_code&code=0.AXEAcz-Th6VHtU6SY8nqCsMbA-wRT6leNghCrOTDHDVQb3NxACI.AgABAAIAAAD--DLA3VO7QrddgJg7WevrAgDs_wQA9P8QyGf-ot72pE5MFPPx9INaiXUlujQg4CoVAHqCf1i3FbSCHgR_tnttyoCboPfJXWoMPI0yQfn-b8iNuKDobIH2W-8jTAZp64Ujys1viaa_6gJk7-NxoVsLSC1Fl7dJ4_Hhh93U4SpiFmCDVkW84II_YcTP8xDOCCag0LE-_iK9LBgvw6USJXz5TrZkGyTGoDfkz2wN3gyXTh6poL0L5s0RTE8SeqYPf6alsCLww2q3n_zjUyHh1_ub98c5sGYyI75EqF_hQYsF-GGG1YrRddC7Kc_8sPhE8Ij4i8EU0kAq-Bc09aUFEBuzPs00W5QR0wW8fSNF8XECevUfFam-tuQUSXMqMGF_VQqW-9WX2uk9b1eZryiNPD-Fm11adqGjue5XrcVSXQmQS-QLmcYltE1zIj51bLW3n-w4v3cRgSV9iSfEJ1Wp602xY4Yg3AIuYt9HGLp3hwJm8FsuqhturKs0sPsiThAQ8DBoYRrRWo90hU8_dzFfqOYqxe_pNyBO_StO7jcd7cZLMSemS6l_QrUVv1BawpNooACaVC90bgdfozjHdYbDkGVXpwnkDlvN5fUyOwRrxPsEtsAtIS6HHIddpFyvAEll1G8kvIw_vMOJCab7wiAom3SVpZjBtuserUnhOajGjPrKTCOst41uUq1m0lZ8ZAUVpXxyidYAzENic-ss4NrZZpQ", (res) => console.log(res))


POWERSHELL commands
-------------------

--- Login
Connect-ExchangeOnline -Organization 17366dcf-32a3-4ae7-803b-7c2bd8540990

--- IMAP give access to the user
Add-MailboxPermission -Identity "support@vnops.in" -User "support@vnops.in" -AccessRights FullAccess

--- To view the MailBox permission
Get-MailboxPermission -Identity "support@vnops.in"

--- Get Service Principle
Get-ServicePrincipal | fl

--- Get the values from Enterprise application only
New-ServicePrincipal -AppId 20985dfa-4c0c-4302-a7c9-cecc433ff1bf -ServiceId eb039117-8402-4d36-bcb5-91f93a4831fb


--- Gets the current SMTP Disabled status for the user
Get-EXOCasMailbox "support@vnops.in" -Properties SmtpClientAuthenticationDisabled | Select SmtpClientAuthenticationDisabled

--- Gets the current SMTP Disabled status organization wide
Get-TransportConfig | Select SmtpClientAuthenticationDisabled

--- Global set Client Authentication Disabled
Set-TransportConfig -SmtpClientAuthenticationDisabled $False

--- individual user set Client Authentication Disabled


---To Remove extra CCA requests raised by Finance
db.awblegop.updateMany({"awb_no" : {$in: ["12551693294","12551668680","12551849906","12551685620","12551684522","12551849862","12596641624","12550381796","12550381155","12552462476","12552449821","12596727945","12594285483"]}, closing_status: ""}, {$set: {closing_status: "CCA_REQUEST_REJECTED", acted_by: 'backend-team', acted_at_time: Date.now()}})
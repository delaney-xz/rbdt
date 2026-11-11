# রুফাইদা অনলাইন শপ

কালো ও গোল্ড থিমের বাংলা শিশুদের পোশাকের অনলাইন স্টোর। GitHub Pages-এ হোস্ট করা যাবে; পণ্যের তথ্য Firebase Firestore-এ থাকবে এবং অ্যাডমিন Firebase Email/Password Authentication দিয়ে লগইন করবেন।

## ১) Firebase সেটআপ

1. https://console.firebase.google.com/ এ গিয়ে একটি Firebase project তৈরি করুন।
2. Project settings → General → Your apps → Web app তৈরি করুন।
3. পাওয়া `apiKey`, `authDomain`, `projectId`, `appId` কপি করে `firebase-config.js`-এ বসান।
4. Authentication → Sign-in method থেকে **Email/Password** চালু করুন।
5. Authentication → Users থেকে আপনার নিজের অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিয়ে user তৈরি করুন।
6. `firebase-config.js`-এর `ADMIN_EMAIL`-এ একই ইমেইল লিখুন।
7. Firestore Database তৈরি করুন। `firestore.rules`-এ `YOUR_ADMIN_EMAIL@example.com` বদলে একই অ্যাডমিন ইমেইল বসিয়ে Firebase Console → Firestore → Rules-এ Publish করুন।

> গুরুত্বপূর্ণ: অ্যাডমিন ইমেইলটি `firebase-config.js` এবং `firestore.rules`—দুই জায়গায় একই হতে হবে। Firestore Rules-ই আসল অনুমতি নিয়ন্ত্রণ করে; শুধু ওয়েবসাইটের UI-তে পাসওয়ার্ড থাকা নিরাপত্তা নয়।

## ২) ছবি যোগ করা

এই প্রথম সংস্করণে পণ্যের ছবির জন্য পাবলিক HTTPS image URL দিতে হবে। আপনার নিজস্ব ওয়েবসাইটে বা অনুমোদিত image hosting-এ ছবি আপলোড করে সরাসরি ছবির URL দিন। Firebase Storage ব্যবহার করতে চাইলে billing/plan ও Storage Rules আগে যাচাই করুন।

## ৩) GitHub Pages-এ লাইভ

1. GitHub-এ নতুন public repository তৈরি করুন, যেমন `rufayda-online-shop`।
2. এই ফোল্ডারের সব ফাইল repository-র root-এ upload করুন।
3. `firebase-config.js` ও `firestore.rules`-এ নিজের তথ্য বসিয়ে commit করুন।
4. Repository → Settings → Pages → Deploy from a branch নির্বাচন করুন।
5. Branch হিসেবে `main`, folder হিসেবে `/ (root)` নির্বাচন করে Save করুন।
6. কয়েক মিনিট পর GitHub Pages-এর দেওয়া URL-এ সাইট চালু হবে।

## ৪) অর্ডার কীভাবে কাজ করবে

কাস্টমার নাম, মোবাইল, সম্পূর্ণ ঠিকানা ও পরিমাণ দিয়ে অর্ডার করলে `wa.me/8801874734373`-এ পণ্যের বিবরণসহ WhatsApp চ্যাট খুলবে। WhatsApp-এ কাস্টমারকে **Send** চাপতে হবে। ওয়েবসাইট নিজে থেকে WhatsApp-এ মেসেজ পাঠাতে পারে না।

## ৫) বর্তমান সংস্করণের সীমা

- অর্ডার WhatsApp-এ পাঠানোর জন্য প্রস্তুত হয়; অর্ডারের আলাদা অনলাইন ড্যাশবোর্ড/অর্ডার ইতিহাস নেই।
- পণ্যের ছবি URL দিয়ে যোগ হয়; ফাইল আপলোড সুবিধা নেই।
- GitHub Pages static hosting; Firebase project ও security rules আলাদাভাবে সেটআপ করতে হবে।
- লাইভ করার আগে Firebase Rules, admin login এবং WhatsApp order flow পরীক্ষা করুন।

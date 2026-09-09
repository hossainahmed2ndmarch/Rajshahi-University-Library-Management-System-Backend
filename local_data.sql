--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users (id, email, phone, password, role, status, name, "avatarUrl", "studentOrVoterId", institution, department, session, "paymentMethod", "isPaid", "membershipStartedAt", "membershipExpiresAt", "createdAt", "updatedAt") VALUES (122, 'admin.rahman@ru.ac.bd', '01710000002', '$2b$10$sOXle6FnB4.na/McZrPKre4tiSNOwPs6osbqF8fNg3QHkNBJl3Nw.', 'ADMIN', 'ACTIVE', 'Dr. Abdur Rahman (Admin)', NULL, 'ADM-00002', 'University of Rajshahi', 'Islamic Studies', NULL, NULL, true, '2026-08-27 15:24:59.836', '2027-08-27 15:24:59.836', '2026-08-27 15:24:59.838', '2026-08-27 15:24:59.838');
INSERT INTO public.users (id, email, phone, password, role, status, name, "avatarUrl", "studentOrVoterId", institution, department, session, "paymentMethod", "isPaid", "membershipStartedAt", "membershipExpiresAt", "createdAt", "updatedAt") VALUES (123, 'shifter.hasan@ru.ac.bd', '01710000003', '$2b$10$rHWpgdaTURcB6WPTHvksN./Q9ycDqR7ZV.1qVss6abiPpJ7h/M0PS', 'SHIFTER', 'ACTIVE', 'Hasan Mahmud (Duty Shifter)', NULL, 'SHF-00003', 'University of Rajshahi', 'Arabic Literature', NULL, NULL, true, '2026-08-27 15:24:59.904', '2027-08-27 15:24:59.904', '2026-08-27 15:24:59.907', '2026-08-27 15:24:59.907');
INSERT INTO public.users (id, email, phone, password, role, status, name, "avatarUrl", "studentOrVoterId", institution, department, session, "paymentMethod", "isPaid", "membershipStartedAt", "membershipExpiresAt", "createdAt", "updatedAt") VALUES (124, 'nusrat.student@ru.ac.bd', '01710000004', '$2b$10$fRZQ/jgwxvWDxcShL8lcZOPYfmPHiCcTNWzsV4WaJowumRg56lgd6', 'MEMBER', 'ACTIVE', 'Nusrat Jahan (Registered Member)', NULL, 'RU-2024-8891', 'University of Rajshahi', 'Islamic History', NULL, NULL, true, '2026-08-27 15:24:59.973', '2027-08-27 15:24:59.973', '2026-08-27 15:24:59.975', '2026-08-27 15:24:59.975');
INSERT INTO public.users (id, email, phone, password, role, status, name, "avatarUrl", "studentOrVoterId", institution, department, session, "paymentMethod", "isPaid", "membershipStartedAt", "membershipExpiresAt", "createdAt", "updatedAt") VALUES (125, 'member@ru.ac.com', '01746911773', '$2b$10$JgaVuX64I392NaFtK7b/o.zrwY3zhuM.HDGAPrCY8iWK9NNq0klWK', 'MEMBER', 'ACTIVE', 'মো: রিয়াজ উদ্দীন', NULL, '2510816194', 'University of Rajshahi', 'আইন', '2024-2025', 'CASH', true, '2026-08-17 00:00:00', '2027-02-17 00:00:00', '2026-08-27 15:35:53.341', '2026-08-27 15:35:53.341');
INSERT INTO public.users (id, email, phone, password, role, status, name, "avatarUrl", "studentOrVoterId", institution, department, session, "paymentMethod", "isPaid", "membershipStartedAt", "membershipExpiresAt", "createdAt", "updatedAt") VALUES (120, 'superadmin@library.com', '01700000000', '$2b$10$WyoLqpIh4K/CzYMQfXRITe2SlJkrZJ5Bi8xCY30/XKqQfSlkdJwbW', 'SUPER_ADMIN', 'ACTIVE', 'Super Admin', '', 'SA-00001', NULL, NULL, NULL, NULL, true, '2026-08-27 15:24:22.708', NULL, '2026-08-27 15:24:22.851', '2026-09-02 16:54:22.264');


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.books DISABLE TRIGGER ALL;

INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (67, 'পরানবন্দী', 'ডা. শামসুল আরেফীন', '1003', 'Rack-Unassigned', 'ভ্রমণ ও প্রবাস: ক্লাসিক', 'সন্দীপন', 132, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788515701/ruil-library/books/xmf3u2ftcxj2onxs2mln.png', 'আমাদের অন্তরকে বানানোই হয়েছে এইভাবে। এই দিল অন্যকারও সংস্পর্শে ততটা উজ্জীবিত হয় না, যতটা হয় নবিজির ক্ষেত্রে। আমাদের আবেগ-ভালোবাসা-শিহরন সব উথলে ওঠে এই একটা নামের মধ্যেই। এইখানে এসে আমরা কোনো ছাড় দিতে রাজি না। মুহাম্মাদ স. আমাদের সম্মান, আমাদের গাইরত। তাঁকে ছেড়ে আমরা জান্নাতে যেতেও রাজি না। নবি-প্রেমিক অনেক মানুষ সফর করেছেন তাঁর রওজায়। রওজাকে একবার যে স্বচোক্ষে দেখেছে, রিয়াজুল জান্নাতে যে একবার দুই রাকাত নামাজ পড়েছে, সে জানে দিলের হালত কেমন হয়। প্রতিটি মুহূর্তে, প্রতিটি ক্ষণে মনে হতে থাকে—হৃদয়টা বান্ধা আছে এই সবুজ গম্বুজের মধ্যে। আর যদি ফেরা না লাগত! কেউ যদি এসে তাড়া না দিত! আহ, কতই-না ভালো হতো! আর বাইতুল্লাহকে দেখে তো চোখের পানি অটোমেটিক ঝরতে থাকে। মনে হয় জীবনটা এখানেই কাটিয়ে দিই। “আমি শুয়ে আছি কাবার ছায়ায়, কেন আমাকে জাগিয়ে দেওয়া হবে! আমি আশ্রয় নিয়েছি জান্নাতের টুকরায়, কেন আমাকে ভিসার কথা বলে তাড়া দেওয়া হবে!” মন মানে না। কিন্তু বেঁধে দেওয়া সময় ফুরিয়ে যায় চোখের পলকেই। দিলের ভেতরটা মোচড় দিয়ে ওঠে। মনে হয়, এই দরজা ছেড়ে দু’কদম সামনে এগোলেই আমি মারা যাব। এই বইতে হজের এমন মনোমুগ্ধকর বর্ণনাই স্থান পেয়েছে। ভ্রমণকাহিনী হিসেবে লেখক যা তুলে ধরেছেন, সেটা যে-কারও হৃদয়কে গলিয়ে দেবে। বইটি শেষ করে পাঠক বুঝতে পারবেন, মুমিনের পরান আসলে কোথায় বাধা আছে। পরানবন্দির জগতে আপনাকে স্বাগতম…', false, 120, NULL, '2026-09-04 09:54:52.115', '2026-09-04 09:54:52.115', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (68, 'মুক্ত বাতাসের খোঁজে', 'লস্ট মডেস্টি', '1004', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'Ilmhouse', 240, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788516172/ruil-library/books/qs73lb1uugn6qohzko6q.jpg', 'কতো তাড়াতাড়ি বড় হয়ে গিয়েছি... এই তো কয়েকদিন আগেই হাফ প্যান্ট পড়া দশ বছরের কোঁকড়া চুলের এক বালক। তার স্কুল মাঠের কড়াই গাছের নিচে বসে নদীর দিকে উদাস হয়ে তাকিয়ে থাকতো পায়ের কাছে আছড়ে পড়তো দলবেঁধে অনেক দূর পাড়ি দেওয়া ঢেউ। মাঝে মাঝে সে ঢেউ গোনার ব্যর্থ চেষ্টা করত। কিন্তু খেই হারিয়ে ফেলতো একটু পরেই। আবার উদাস হয়ে তাকাতো নদীর দিকে। কখনোবা আকাশের দিকে। দুপুরের বৃষ্টিভেজা রোদে মাঝে মাঝে একটা সোনালী ডানার চিল উড়ে বেড়াতো করুন সুরে ডেকে উঠতো হঠাৎ হঠাৎ। বালক আরো উদাস হয়ে যেত। কখনো কখনো বালক স্কুল থেকে ঘরে ফেরার সময় অবাক হয়ে দেখাতো আকাশ কালো করে বৃষ্টি আসছে। বালকের ছাতা ছিলো না। কাজেই সেই ঝুম বৃষ্টির কবল থেকে বই খাতা বাঁচাতে একহাতে স্যান্ডেল আর একহাতে বই নিয়ে ভোঁ দৌড় দিত। মাঝে মাঝে রাস্তার কাদায় পিছলে পড়ে যেত। কাঁদা মাখা ভুত হয়ে ফিরতো বাসায়। মা ব্যর্থ চেষ্টা করতো আঁচল দিয়ে মাথা মুছে দেয়ার। মায়ের হাত থেকে নিজেকে মুক্ত করে বালক দৌড়ে লাফিয়ে পড়তে পুকুরে। পুকুরের স্বচ্ছ পানিতে বৃষ্টির ফোঁটা অদ্ভুত শব্দ করত। বালক অবাক হয়ে শুনতো সে শব্দ। দীর্ঘসময় পুকুরে দাপাদাপি করার পর চোখ লাল করে সে ফিরতো মা আঁচল দিয়ে মাথা মুছে দিতো শান্ত ছেলের মতো পুঁটি মাছের ভাজি দিয়ে গোগ্রাসে গরম ধোঁয়া উঠা ভাত গিলে, গল্পের বই নিয়ে কাঁথামুড়ি দিয়ে শুয়ে পড়তো বালক। টিনের চালে তখন একটানা বৃষ্টি পড়তো । বাইরে সজনে গাছটা উড়ে চলে যেতে চাইতো হাওয়ার সাথে । কলাগাছের পাতায় চলতো বাতাসের দাপাদাপি। বালক গল্পের বইয়ে ডুবে যেত। দুষ্টু বাবার কবল। থেকে নৌকা নিয়ে পালাচ্ছে হাকল বেরি ফিন... সে কি নিরাপদে পালাতে পারবে? ওর বাবা ওকে ধরে ফেলবে? টান টান উত্তেজনা! একসময় ঘুমিয়ে পড়তো বালক ঘুমের ঘোরেই ভয় পেত বিদ্যুৎচমকের শব্দে। মা মাঝে মধ্যে পাশে এসে শুয়ে থাকতো ঘুমের ঘোরে সে জড়িয়ে ধরতো তার মায়ের গলা- এই পৃথিবীতে তার সবচেয়ে আপন মানুষটিকে......', false, 120, NULL, '2026-09-04 10:02:46.435', '2026-09-04 10:02:46.435', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (65, 'আকাশের ওপারে আকাশ', 'আসিফ আদনান', '1001', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'Ilmhouse', 287, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788515131/ruil-library/books/tcagbxmixhipkl2edddd.jpg', 'একটা অদ্ভুত সমস্যার মধ্যে আছি আমরা। সমাজ ও সভ্যতা প্রেমকে মহিমান্বিত করে। প্রেম ছাড়া জীবন রঙহীন, নিষ্প্রাণ। অপূর্ণ। অর্থহীন। জীবনের সঞ্চিত অভিজ্ঞতার চূড়ো হলো প্রেম। বাকি সব সাইডস্টোরি, বাকি সবাই এবং সবকিছু পার্শ্বচরিত্র। আধুনিক মানব ও মানবীরা তাই পথে পথে নেড়েচেড়ে, চেখে দেখে সব নুড়ি পাথর। গভীর এক তৃষ্ণা নিয়ে খুঁজে ফেরে প্রেমের সেই পরশপাথর। আর এই খোঁজকে উপস্থাপন করা হয় মাদকতাময় সৌন্দর্যের সাথে। আবার, সমাজ ও সভ্যতায় আমরা পতনের চিহ্ন দেখতে পাই। আমরা দেখি হতাশার মহামারি, পরিবারের ভাঙন আর গন্তব্যহীন প্রজন্ম। আমরা দেখি, ক্রাশ কনফেশনস এর কেলেঙ্কারির গল্প। আমরা দেখি শরীরের যথেচ্ছ ব্যবহার, বিয়ের প্রলোভনে ধর্ষণ, ভাইরাল ভিডিও, বছরে লক্ষ লক্ষ গর্ভপাত আর মাসে গড়ে ৫০টার মতো আত্মহত্যার খবর। দেখি অবক্ষয়, অধঃপতন আর ক্লেদাক্ত কলুষতা। দুটো ছবি প্রায় বিপরীতমুখী। আবার একটা আরেকটার সাথে যুক্ত নিবিড়ভাবে। কিন্তু এই সম্পর্কটা আমরা দেখতে পাই না। আমরা দেখতে চাই না। চোখের সামনে সব চিহ্ন থাকার পরও হিসেব মেলে না আমাদের। কেন এই অদ্ভুত বৈপরীত্য? রহস্যটা কোথায়? প্রেমের অলীক রূপকথার ঐ আকাশের আড়ালে আরো একটা আকাশ আছে। মাটি আর মানুষের, ঘাসফড়িং আর শিশিরের এবং মৌলিক ভালোবাসার। যে আকাশ আধুনিকতার একমাত্রিক চশমায় ধরা দেয় না। শুভ্রতায় মোড়ানো সেই আকাশটাকে নিজের করে নেবার ব্যাকরণ নিয়েই আমাদের এই আয়োজন- আকাশের ওপারে আকাশ।', false, 120, NULL, '2026-09-04 09:45:47.077', '2026-09-04 09:45:47.077', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (66, 'অবক্ষয়কাল', 'আসিফ আদনান', '1002', 'Rack-Unassigned', 'ইসলামি গবেষণা', NULL, 368, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788515334/ruil-library/books/ophl4k46zsovehq2fupg.jpg', 'লুইস ক্যারলের বিখ্যাত বই ‘অ্যালিস ইন ওয়ান্ডারল্যান্ড’-এ কোনো কিছুই স্বাভাবিক নিয়ম মতো হয় না। শুঁয়োপোকা হুক্কা খায়, নুড়ি পাথর কেক হয়ে যায়, আর ছোট্ট শিশু হয়ে যায় শূকরছানা। আজব দেশের রাণী বিচারের সময় চেঁচিয়ে ওঠে, ‘শাস্তি আগে, রায় পরে’! অদ্ভুতুড়ে এক জগৎ! আধুনিকতার রাজপথে হাঁটতে গিয়ে বিশ্ব যেন পথ ভুলে অ্যালিসের ওয়ান্ডারল্যান্ডের মতো কোনো এক জগতে ঢুকে পড়েছে। যেখানে পুরুষ বিয়ে করে অন্য পুরুষকে, নারী বিয়ে করে নারীকে। ছয় বাচ্চার বাপ বর্ষসেরা নারীর খেতাব পায়, নিজেকে নারী দাবি করে মহিলা কারাগারে ঢুকে পড়ে পুরুষ কয়েদী, স্কুলের বাচ্চাদের শেখানো হয় ‘যাহা নারী তাহাই পুরুষ’ আর আইন, আদালত, সমাজ দিব্যি সেটা মেনেও নেয়। প্রতিদিন যেন একটু একটু করে মৃত সাগরপাড়ের শহরগুলোর মতো হয়ে উঠে আমাদের পৃথিবী। অ্যালিসের জগতটা ছিল মজার। কিন্তু আমাদের এ জগৎ ভয়ঙ্কর বিভীষিকার। কেন সবার একযোগে এই অবিশ্বাস্য রকমের পাগলামি? কীভাবে স্বাভাবিক হয়ে উঠলো এতোসব বিকৃতি? অ্যালিসের যাত্রা শুরু হয়েছিল এক সাদা খরগোশের পিছু নিতে গিয়ে। খুঁজতে খুঁজতে তার গর্তে ঢুকে পড়েছিল অ্যালিস। সেই গর্ত তাকে নিয়ে দাঁড় করিয়ে দিয়েছিল আজব এক দুনিয়াতে। প্রশ্নগুলোর জবাব পেতে হলে আমাদেরও নামতে হবে খরগোশের গর্তে। দেখতে হবে এ গর্ত আসলে কতোটা গভীর!', false, 120, NULL, '2026-09-04 09:48:50.976', '2026-09-04 09:48:50.976', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (44, 'Stories of the Prophets (Qasas al-Anbiya)', 'Ibn Kathir', '978-1591440000', 'Rack-C2-01', 'History', 'Darussalam', 620, 'SELL_ONLY', 350, 0, 29, 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=1000', 'Chronicles and biographies of all the prophets mentioned in the Holy Quran.', true, 120, NULL, '2026-08-27 15:24:23.08', '2026-09-02 12:31:31.524', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (43, 'Riyad us-Saliheen (Gardens of the Righteous)', 'Imam An-Nawawi', '978-2987456123', 'Rack-B1-05', 'Spirituality', 'Darussalam', 960, 'HYBRID', 650, 20, 14, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1000', 'Essential compilation of verses and hadiths for moral character and spiritual devotion.', true, 120, NULL, '2026-08-27 15:24:23.075', '2026-09-02 12:33:15.268', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (69, 'অনেক আঁধার পেরিয়ে', 'মুহাম্মাদ জাভেদ কায়সার (রহ)', '1005', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'সত্যায়ন প্রকাশন', 192, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788516551/ruil-library/books/baujkdbp4a6tcshcw6yw.png', 'স্বপ্ন ঠিক করে দেয় ওরা… বড়সড় একটা ফ্ল্যাট, সিক্স ডিজিট স্যালারির জব, সুন্দরী বউ, গ্যারাজে লেইটেস্ট মডেলের গাড়ি, বছরে দুবার ট্যুর অথবা সাদা চামড়ার দেশের গ্রিন কার্ড… ব্যস তুমি সফল।সততা? আদর্শ? মূল্যবোধ?ধুর, ভুলে যাও ওসব! ছলচাতুরির চাদর গায়ে জড়িয়ে নাও নির্দ্বিধায়, দুরভিসন্ধির খেলা খেলে যাও শর্তহীনভাবে। সফল হতেই হবে নাহলে তুমি পিষ্ট হয়ে যাবে জন-অরণ্যের-সামাজিকতার-চাপে। তোমার জীবন হবে ষোলো আনাই বৃথা।আমরা ভুল করি। স্বপ্ন-সুখ ছোঁয়ার মাতাল নেশায় মত্ত হয়ে আর সবকিছুকে দূরে সরিয়ে গৃহপালিত জীবনযাপন করে পার করে দিই মাটির পৃথিবীর এই এক জীবন। সুখ পাই না। যারা লক্ষ্যে পৌঁছে তারাও অবাক হয়ে দেখে সেখানেও সুখ নেই। সুখ তা হলে কোথায়?কিছু কিছু মানুষ থাকেন ব্যতিক্রম। সুখ, সফলতা, স্বপ্নের আলেয়াকে ঠিকই তারা চিনতে পারেন। স্বপ্ন-বেচা চোরাকারবারিদের মধুর কথাও ভোলাতে পারে না তাদের। ঠিকই তারা চিনে নেন চিরসুখের, চিরশান্তির, চিরসফলতার সেই পথ। সুখ সন্ধানীদের ভালোবেসে চিনিয়ে দেন… পথিক, সুখ এই পথে, এ পথেই আছে…কী সেই পথ ? সেই পথের দিশা নিয়েই ‘অনেক আঁধার পেরিয়ে', false, 120, NULL, '2026-09-04 10:09:03.64', '2026-09-04 10:09:03.64', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (70, 'মুমিনের ক্যারিয়ার ভাবনা', 'ডা. শামসুল আরেফীন', '1006', 'Rack-Unassigned', 'প্রফেশনাল ও ক্যারিয়ার উন্নয়ন', 'চেতনা প্রকাশন', 152, 'BORROW_ONLY', NULL, 3, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788517258/ruil-library/books/tf2b6wxnaiq86likgnou.jpg', 'কেমন হবে একজন খাঁটি মুমিনের ক্যারিয়ার? কী হবে তার জীবনের লক্ষ? ক্যারিয়ার মানেই আমরা বুঝি টাকা এবং সম্মান। ক্যারিয়ারের মধ্য দিয়ে মানুষ সম্মান খোঁজে, ক্যারিয়ারের মধ্য দিয়ে মানুষ টাকা খোঁজে। কিন্তু ক্যারিয়ারের মধ্য দিয়ে সম্মান খোঁজা, ক্যারিয়ারের মধ্য দিয়ে টাকা খোঁজা, এটা মুমিনের লক্ষ হতে পারে না। কারণ, মুমিন বিশ্বাস করে, টাকা আসে আল্লাহ তাআলার কাছ থেকে। রিজিক আসে আল্লাহ তাআলার কাছ থেকে এবং সম্মানও আসে আল্লাহ তাআলার কাছ থেকে। আল্লাহ তাআলা রিজিকেরও মালিক, সম্মানেরও মালিক। এটা আল্লাহ তাআলা যে কাউকে ক্যারিয়ার ছাড়াই দিতে পারেন, এটা আমাদের বিশ্বাস। সুতরাং আমাদের ক্যারিয়ারটা হবে অন্যান্য মানুষের চেয়ে আলাদা। একজন মুমিনের ক্যারিয়ার হবে মূলত দুইটা উদ্দেশ্যে, একটা হচ্ছে দাওয়াহ, আরেকটা হচ্ছে, সাদাকাহ। একজন মুমিন উপরে উঠবে, অনেক উপরে উঠবে। একজন মুমিন সম্পদ উপার্জন করবে, অনেক সম্পদ উপার্জন করবে, কোনো সমস্যা নেই। কিন্তু তার লক্ষ্য থাকবে দুইটা। একটা হচ্ছে, সদাকাহ করা, এবং দুই নম্বরে হচ্ছে, দাওয়াহ করা। দ্বীনের দাওয়াহ করা। মানুষের কাছে দ্বীনটাকে উপস্থাপন করা।', false, 120, NULL, '2026-09-04 10:20:51.943', '2026-09-04 10:20:51.943', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (71, 'মুহসিনীন', 'জিম তানভীর, ডা. শাফায়েত হোসেন লিমন, মহি উদ্দীন আহাম্মদ, শাইখ আব্দুল্লাহ আল মামুন', '1007', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'ইনবাত পাবলিকেশন', 292, 'HYBRID', NULL, 10, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788517639/ruil-library/books/n6pdxovkqc5hzm8lhhj8.png', 'পুরুষ, এক যোদ্ধার নাম। শৈশব থেকে তার যুদ্ধ শুরু; সমাজের সাথে, ভ্রান্তির বিপক্ষে। মাঝে মাঝে যুদ্ধ চলে নিজের সাথেও। তবু হিংস্র চেহারার অগোচরে লুকিয়ে থাকে কোমলতা যা খুবই টের পাওয়া যায়। পুরুষ তো আত্মভোলা, নিজেকে সে ভুলে থাকে। নিজেকে ক্ষয় করে গড়ে তোলে পরিবার, সমাজ ও জাতি। পুরুষদের অন্তর গভীর সমুদ্রের মতো। সকল কষ্ট লুকিয়ে থাকে বুকের গহিনে, আঁধারে। মুখ ফুটে বলে না কখনো। জীবনটা বিলিয়ে দিতেই যেন পুরুষের জন্ম।দ্বীন পুরুষকে সুপুরুষ করে গড়ে তোলে। দ্বীন তাকে শেখায় পবিত্রতা; তা যতটা দেহের ঠিক ততটাই অন্তরেরও। রাগ নিয়ন্ত্রণ, সবর ও নম্রতা, অন্তরের কুপ্রবৃত্তির সাথে আমরণ লড়ে যাওয়া; এসবই উত্তম পুরুষদের জীবনের মূল্যবান সবক। সমাজের পিঠে অশ্লীলতার কশাঘাত; ফলে যিনা-ব্যভিচার এখন সহজ, বিয়ে হয়ে গিয়েছে কঠিন। সাধারণ ঘরের মুসলিম পুরুষদের মাঝে অনেকেই একটা সময় জাহিলিয়াতের ঘোর অন্ধকারে নিমজ্জিত ছিল। আল্লাহর ইচ্ছায় অনেকেই ইসলামের ছায়াতলে ফিরে আসে। কিন্তু আগের ভুতুড়ে সেসব স্মৃতি প্রতিনিয়ত হাতছানি দেয়। মাঝে মাঝে বীরেরা হেরে যায় অন্তরের সাথে এক ঠান্ডা যুদ্ধে। রাজ্যের বিষাদ গ্রাস করে তাকে। বিয়েই যেন সমাধান। কিন্তু বিয়ের পর যে এক নতুন জীবনের সাথে সাথে শুরুর হয় নতুন অজানা এক দায়িত্ব, সেটাও তো মাথায় রাখা উচিত।আল্লাহ সুবহানা ওয়া তা’আলা অনুগ্রহশীল, তাই তিনি ভালোবাসেন তাদেরকে যারা অন্যের ওপর এবং নিজের ওপর অনুগ্রহ করে। তারাই তো ‘মুহসিনীন’, বিভ্রাটের দুনিয়ায় উত্তমদের অন্তর্গত।', false, 120, NULL, '2026-09-04 10:27:22.274', '2026-09-04 10:27:22.274', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (72, 'এখন যৌবন যার', 'মাওলানা যুলফিকার আহমদ নকশবন্দী (রহ)', '1008', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'উমেদ প্রকাশ', 320, 'HYBRID', 500, 10, 5, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788518160/ruil-library/books/ugwpweexpkytrc95qvf4.jpg', 'স্বাভাবিকভাবেই একজন যুবককে নফস ও শয়তান নানাভাবে পরাস্ত করার চেষ্টা করে। কারণ, জীবনের এই বেলাটায় মানুষের ভেতর যৌন-তাড়না থাকে বেশি। আর একে ব্যবহার করেই যুবককে ঘায়েলের চেষ্টা করা হয়।এ তো হলো সাধারণ হিসাব। কিন্তু আমাদের এ নষ্ট সময় ও পরিবেশে একজন যুবককে অনেক বেশি প্রতিবন্ধকতার সম্মুখীন হতে হয়। রাস্তার বেপর্দা পরিবেশ থেকে শুরু করে কলেজ-ইউনিভার্সিটির সহশিক্ষা, ইন্টারনেটের মতো জরুরি উপকরণের রন্ধ্রে রন্ধ্রে থাকা চরম অশ্লীলতা ও বেহায়াপনা, সামাজিক যোগাযোগ মাধ্যমের স্রোতে ভেসে আসা নানারকমের আজাব… সব মিলিয়ে যুবক এখন বিপদে। আগে যে যৌবন ছিল বিপুল সম্ভাবনার আধার, এখন সে যৌবন যেন হাজারো বিপদের আশঙ্কা ।‘এখন যৌবন যার’ বইতে লেখক তুলে ধরেছেন এক আখ্যান, যুবক যাকে আঁকড়ে ধরতে পারবে এই অকুল দরিয়ার অবলম্বন হিসেবে।', false, 120, NULL, '2026-09-04 10:36:07.855', '2026-09-04 10:36:07.855', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (73, 'কুরআন থেকে নেওয়া জীবনের পাঠ', 'আরিফ আজাদ', '1009', 'Rack-Unassigned', 'ইসলামী সাহিত্য', 'সত্যায়ন প্রকাশন', 184, 'HYBRID', 500, 10, 5, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788518489/ruil-library/books/e3snje5qf1or9ve0rew9.jpg', 'এককথায়— কুরআন কীভাবে আমাদের জীবনের কথা বলে, কীভাবে আমাদের জীবনে কুরআন হয়ে উঠতে পারে আলোর দিশা, কুরআনের আয়াতগুলো থেকে কীভাবে আমরা আহরণ করতে পারি মণি-মুক্তো, কীভাবে কুরআন আমাদের চিন্তার জগতে আনতে পারে নতুন মাত্রা— পাঠক পরিচিত হবে সেরকম একটা ধারার সাথে। উঁহু, গতানুগতিক গদ্য বা খটমটে প্রবন্ধ নয়, প্রতিটা অধ্যায়ে পাঠক দেখতে পাবে তার জীবনের প্রতিচ্ছবি, জীবন থেকে নেওয়া ঘটনা অথবা চারপাশের চিরচেনা জগতের সাথে কুরআন কীভাবে ওতপ্রোতভাবে সম্পর্কিত। জীবনের গল্প পড়তে পড়তে পাঠক ঢুকে পড়বে কুরআনের ভাবনার জগতে, সেই জগত থেকে আলো ধার করে পাঠক আবার ফিরে আসবে জীবনের ধারায়— ‘কুরআন থেকে নেওয়া জীবনের পাঠ’ বইটা সাজানো ঠিক এভাবেই, আলহামদুলিল্লাহ।', false, 120, NULL, '2026-09-04 10:41:23.107', '2026-09-04 10:41:23.107', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (74, 'দ্বীনের পথে যাত্রা', 'মাওলানা তানজীল আরেফীন আদনান', '1010', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'উমেদ প্রকাশ', 128, 'BORROW_ONLY', NULL, 2, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788526312/ruil-library/books/buua1dquysksrmvaphqj.webp', 'দশ বছর পরের কথা ভাবুন না, আপনার পরিবারের, বন্ধুদের, আত্মীয়দের অসংখ্য মানুষ দ্বীনের পথে আপনার সহযোগী। বাচ্চাদের কেউ কেউ কুরআন হিফয করে ফেলেছে, ঘরের সবাই একসাথে নামাজে যাচ্ছেন। এলাকার সবাই মিলে বিভিন্ন দ্বীনী উদ্যোগ নিচ্ছেন। এলাকার পরিবেশ অনেকটাই দ্বীনের অনুকূল। কিন্তু এটা হবে কীভাবে? এ জন্য চাই নিয়মতান্ত্রিক দুর্বার মেহনত। এমন মানুষের সংখ্যা এখন একদম কম নয়, যারা জীবনের বিভিন্ন সময়ে বিভিন্নভাবে আখিরাত নিয়ে সচেতন হয়ে ওঠেন। তারা বড় ঝাঁকুনি খান নিজেদের উদাসীন বর্তমান ও অনিশ্চিত ভবিষ্যৎ নিয়ে। মন নিজেকে প্রশ্ন করার সাহস পায়—এই ভুল পথে আর কত? এটিই আসলে হেদায়াত, যা একজন মানুষকে গুনাহের কাদামাটি ধুয়ে-মুছে নেক, পরিচ্ছন্ন ও পবিত্র এক জীবন গড়তে শক্তি দেয়।এ অবস্থায় মানুষের কিছু পথনির্দেশনা প্রয়োজন হয়, যা তাকে আখিরাতের প্রস্তুতি নিতে সহায়তা করবে। সে নিজের জীবন কীভাবে কাটাবে, দ্বীন কীভাবে শিখবে, পরিবারকে কীভাবে দ্বীনের দিকে আনবে। এই পথনির্দেশনা নিয়েই এই অনন্য বই—দ্বীনের পথে যাত্রা।', false, 120, NULL, '2026-09-04 12:51:45.161', '2026-09-04 12:51:45.161', '{}', NULL, 0);
INSERT INTO public.books (id, title, author, isbn, "locationCell", category, publisher, pages, type, "sellPrice", "borrowStock", "sellStock", "coverImage", description, "isArchived", "addedById", "donatedById", "createdAt", "updatedAt", images, "buyPrice", discount) VALUES (75, 'চলো আল্লাহর রঙে রাঙাই', 'মাওলানা তারিক জামিল', '1012', 'Rack-Unassigned', 'আত্মশুদ্ধি ও অনুপ্রেরণা', 'উমেদ প্রকাশ', 176, 'BORROW_ONLY', NULL, 1, 0, 'https://res.cloudinary.com/dmpvhqlve/image/upload/v1788598716/ruil-library/books/oo4pjzxn1g8py8fpoxxl.jpg', 'আল্লাহ তাআলা তওবাকারীকে সবচেয়ে বেশি ভালোবাসেন। আল্লাহ তাআলার কাছে তওবাহীন হাজার রাত তাহাজ্জুদগুজারের চেয়ে তওবাকারী পাপী ব্যক্তি অধিক পছন্দনীয়! আল্লাহ তাআলা চান, দিনশেষে বান্দা তাঁর কাছেই ফিরে আসুক। এসো ভাই, মৃত্যু শাহরগ ছোঁয়ার আগেই তওবা করে নিই। এমন যেন না হয়, দুনিয়ায় ব্যস্ত থাকতে থাকতে তওবার কথাই ভুলে গিয়েছি! হে আদমসন্তান, তোমার রব তো তোমার হয়েই আছেন, তুমিও তাওবার পথে ফিরে এসো। তোমার রবের হয়ে যাও। জীবনটাকে আল্লাহর রঙে রাঙাও। চলো আল্লাহর রঙে রঙিন হই!', false, 120, NULL, '2026-09-05 08:58:28.756', '2026-09-05 08:58:28.756', '{}', NULL, 0);


ALTER TABLE public.books ENABLE TRIGGER ALL;

--
-- Data for Name: book_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.book_reviews DISABLE TRIGGER ALL;



ALTER TABLE public.book_reviews ENABLE TRIGGER ALL;

--
-- Data for Name: borrows; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.borrows DISABLE TRIGGER ALL;



ALTER TABLE public.borrows ENABLE TRIGGER ALL;

--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.donations DISABLE TRIGGER ALL;

INSERT INTO public.donations (id, "donorName", "donorEmail", "contactPhone", method, status, "isAnonymous", "donorNote", "bookTitle", author, category, quantity, "pickupAddress", "donorId", "receivedById", "catalogedBookId", "scheduledAt", "receivedAt", "createdAt", "updatedAt") VALUES (22, 'Anonymous Donor', NULL, '01912229980', 'LIBRARY_DROP_OFF', 'REJECTED', true, NULL, 'পীরে কামিল', ' উমেরা আহমেদ ,  সাদমান সিদ্দীক (অনুবাদক)', 'General', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-27 15:26:35.651', '2026-09-02 12:33:54.238');
INSERT INTO public.donations (id, "donorName", "donorEmail", "contactPhone", method, status, "isAnonymous", "donorNote", "bookTitle", author, category, quantity, "pickupAddress", "donorId", "receivedById", "catalogedBookId", "scheduledAt", "receivedAt", "createdAt", "updatedAt") VALUES (24, 'মো: রিয়াজ উদ্দীন', 'member@ru.ac.com', '01746911773', 'LIBRARY_DROP_OFF', 'APPROVED', false, 'Condition: GOOD', 'aasdsgd', 'sdad', 'General', 1, NULL, 125, 122, NULL, NULL, '2026-09-02 12:40:13.073', '2026-09-02 12:40:13.075', '2026-09-02 12:40:13.075');
INSERT INTO public.donations (id, "donorName", "donorEmail", "contactPhone", method, status, "isAnonymous", "donorNote", "bookTitle", author, category, quantity, "pickupAddress", "donorId", "receivedById", "catalogedBookId", "scheduledAt", "receivedAt", "createdAt", "updatedAt") VALUES (23, 'Anonymous Donor', NULL, NULL, 'LIBRARY_DROP_OFF', 'APPROVED', true, 'Condition: GOOD', 'adsgreed', 'asda', 'General', 1, NULL, NULL, 122, NULL, NULL, '2026-09-02 12:38:55.066', '2026-09-02 12:38:55.068', '2026-09-02 12:38:55.068');
INSERT INTO public.donations (id, "donorName", "donorEmail", "contactPhone", method, status, "isAnonymous", "donorNote", "bookTitle", author, category, quantity, "pickupAddress", "donorId", "receivedById", "catalogedBookId", "scheduledAt", "receivedAt", "createdAt", "updatedAt") VALUES (25, 'Dr. Abdur Rahman (Admin)', 'admin.rahman@ru.ac.bd', '01710000002', 'LIBRARY_DROP_OFF', 'APPROVED', false, NULL, 'wdgjuil', 'Unknown Author', 'General', 1, NULL, 122, 120, NULL, NULL, '2026-09-03 09:25:47.249', '2026-09-02 12:45:36.655', '2026-09-03 09:25:47.253');


ALTER TABLE public.donations ENABLE TRIGGER ALL;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.payments DISABLE TRIGGER ALL;

INSERT INTO public.payments (id, "transactionId", "userId", amount, "paymentMethod", status, "paidAt", "createdAt", "updatedAt") VALUES (9, 'POS-1787848071196-1951', 125, 650, 'CASH', 'COMPLETED', '2026-08-27 16:27:51.21', '2026-08-27 16:27:51.211', '2026-08-27 16:27:51.211');
INSERT INTO public.payments (id, "transactionId", "userId", amount, "paymentMethod", status, "paidAt", "createdAt", "updatedAt") VALUES (10, 'POS-1788352886046-7328', 124, 750, 'CASH', 'COMPLETED', '2026-09-02 12:41:26.062', '2026-09-02 12:41:26.063', '2026-09-02 12:41:26.063');
INSERT INTO public.payments (id, "transactionId", "userId", amount, "paymentMethod", status, "paidAt", "createdAt", "updatedAt") VALUES (11, 'TXN-1788353195059-3451', 122, 750, 'CASH', 'PENDING', NULL, '2026-09-02 12:46:35.072', '2026-09-02 12:46:35.072');
INSERT INTO public.payments (id, "transactionId", "userId", amount, "paymentMethod", status, "paidAt", "createdAt", "updatedAt") VALUES (12, 'TXN-1788426438996-4622', 120, 750, 'CASH', 'PENDING', NULL, '2026-09-03 09:07:19.043', '2026-09-03 09:07:19.043');


ALTER TABLE public.payments ENABLE TRIGGER ALL;

--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.purchases DISABLE TRIGGER ALL;



ALTER TABLE public.purchases ENABLE TRIGGER ALL;

--
-- Data for Name: service_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.service_reviews DISABLE TRIGGER ALL;

INSERT INTO public.service_reviews (id, rating, comment, "isAnonymous", "userId", "reviewerName", "reviewerEmail", "createdAt", "updatedAt") VALUES (4, 5, 'Hello All. It''s a wonderful web experience.', true, NULL, NULL, NULL, '2026-08-27 15:40:56.449', '2026-08-27 15:40:56.449');


ALTER TABLE public.service_reviews ENABLE TRIGGER ALL;

--
-- Data for Name: shift_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.shift_logs DISABLE TRIGGER ALL;

INSERT INTO public.shift_logs (id, "shifterId", "startTime", "endTime", status, "openingCash", "cashCollected", "closingCash", "tasksCompleted", "handoverNotes", "verifiedById", "createdAt", "updatedAt") VALUES (25, 123, '2026-08-27 15:50:46.515', '2026-08-27 15:52:53.11', 'COMPLETED', 500, 0, 500, 'sfsfe', 'frsse', NULL, '2026-08-27 15:50:46.517', '2026-08-27 15:52:53.112');
INSERT INTO public.shift_logs (id, "shifterId", "startTime", "endTime", status, "openingCash", "cashCollected", "closingCash", "tasksCompleted", "handoverNotes", "verifiedById", "createdAt", "updatedAt") VALUES (24, 123, '2026-08-28 03:00:00', '2026-08-27 15:54:56.133', 'CANCELLED', 500, 0, NULL, '[Slot: Morning Shift (09:00 AM – 01:00 PM)]', '[Cancelled]: wwrf', NULL, '2026-08-27 15:48:44.577', '2026-08-27 15:54:56.135');
INSERT INTO public.shift_logs (id, "shifterId", "startTime", "endTime", status, "openingCash", "cashCollected", "closingCash", "tasksCompleted", "handoverNotes", "verifiedById", "createdAt", "updatedAt") VALUES (26, 123, '2026-08-27 15:53:22.605', '2026-08-27 15:56:42.196', 'COMPLETED', 500, 0, 500, 'sfs', 'frsse', NULL, '2026-08-27 15:53:22.606', '2026-08-27 15:56:42.196');
INSERT INTO public.shift_logs (id, "shifterId", "startTime", "endTime", status, "openingCash", "cashCollected", "closingCash", "tasksCompleted", "handoverNotes", "verifiedById", "createdAt", "updatedAt") VALUES (27, 123, '2026-08-27 16:25:28.284', '2026-08-27 16:34:21.401', 'COMPLETED', 500, 0, 500, 'sfs', NULL, NULL, '2026-08-27 16:25:28.294', '2026-08-27 16:34:21.404');
INSERT INTO public.shift_logs (id, "shifterId", "startTime", "endTime", status, "openingCash", "cashCollected", "closingCash", "tasksCompleted", "handoverNotes", "verifiedById", "createdAt", "updatedAt") VALUES (28, 122, '2026-09-02 12:37:42.377', '2026-09-02 12:52:31.448', 'COMPLETED', 500, 0, 500, 'sfs', NULL, NULL, '2026-09-02 12:37:42.38', '2026-09-02 12:52:31.45');


ALTER TABLE public.shift_logs ENABLE TRIGGER ALL;

--
-- Name: book_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.book_reviews_id_seq', 9, true);


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.books_id_seq', 75, true);


--
-- Name: borrows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.borrows_id_seq', 16, true);


--
-- Name: donations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donations_id_seq', 26, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 12, true);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchases_id_seq', 17, true);


--
-- Name: service_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_reviews_id_seq', 4, true);


--
-- Name: shift_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_logs_id_seq', 28, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 125, true);


--
-- PostgreSQL database dump complete
--


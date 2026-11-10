// Starter content for `npm run db:seed`: rooms, sample writers and a first
// batch of echoes, replies and reactions so the app never looks empty.

export const ROOMS = [
  ["Poetry & Verse", "Lines, fragments and the music of language."],
  ["Hindi Sahitya", "Kavita, kahani and everything in between."],
  ["Late Night Thoughts", "What the mind says when the world goes quiet."],
  ["Code & Craft", "Programming, side projects and building things."],
  ["Books We Love", "Currently reading, rereading and recommending."],
  ["Campus Life", "Classes, canteens and the people we meet."],
  ["Music Memories", "Songs that carry a place, a year or a person."],
  ["Travel Diaries", "Journeys, detours and the roads between."],
  ["Letters to Myself", "Notes to who you were and who you're becoming."],
  ["Film & Stories", "Cinema, series and how stories shape us."],
  ["Mindful Moments", "Small pauses, gratitude and slowing down."],
  ["Philosophy Corner", "Big questions, kindly argued."],
  ["Nature & Wild Places", "Hills, rivers, birds and the quiet outdoors."],
  ["Food Stories", "Recipes, street food and the meals we remember."],
  ["Art & Sketches", "Drawing, painting and the joy of making things."],
  ["Study Circle", "Exams, notes, focus tricks and shared effort."],
  ["Startups & Ideas", "Half-formed ideas, side hustles and lessons learned."],
  ["Memories of Home", "Hometowns, family rituals and where we come from."],
  ["Short Fiction", "Tiny stories, openings and unfinished chapters."],
  ["Mental Wellness", "Honest check-ins and gentle ways to cope."],
]

// username, full name, bio, Pulse score, streak
export const WRITERS = [
  ["aarav_sharma", "Aarav Sharma", "Writes poems on the metro.", 18.4, 12],
  ["meera_nair", "Meera Nair", "Reader, tea drinker, collector of old letters.", 15.9, 9],
  ["kabir_singh", "Kabir Singh", "Building small things with code.", 14.2, 7],
  ["ananya_iyer", "Ananya Iyer", "Sketchbook always open.", 12.7, 6],
  ["rohan_verma", "Rohan Verma", "Trains, trekking and bad puns.", 11.3, 5],
  ["ishita_roy", "Ishita Roy", "Slow mornings, long walks.", 10.1, 8],
  ["vihaan_gupta", "Vihaan Gupta", "Film nerd and part-time philosopher.", 9.6, 4],
  ["sara_khan", "Sara Khan", "Biryani is a personality trait.", 8.8, 3],
  ["devansh_mehta", "Devansh Mehta", "Exam season survivor.", 7.5, 6],
  ["tanvi_joshi", "Tanvi Joshi", "Short stories and loud laughter.", 6.9, 2],
  ["priya_menon", "Priya Menon", "Journals everything, finishes nothing (yet).", 13.5, 10],
  ["arjun_patel", "Arjun Patel", "CS student. Chai over coffee.", 12.1, 5],
  ["neha_kapoor", "Neha Kapoor", "Mountains > malls.", 10.8, 4],
  ["rahul_dixit", "Rahul Dixit", "Cricket, cassettes and slow Sundays.", 9.2, 3],
  ["simran_kaur", "Simran Kaur", "Cooking for people is my love language.", 8.4, 7],
  ["aditya_rao", "Aditya Rao", "Two failed startups, still optimistic.", 8.1, 2],
  ["pooja_bhatt", "Pooja Bhatt", "Literature student. Hindi and English, both.", 7.7, 6],
  ["harsh_vardhan", "Harsh Vardhan", "Gym, guitar, group chats.", 6.6, 1],
  ["kavya_reddy", "Kavya Reddy", "Painting at midnight.", 6.2, 5],
  ["imran_ansari", "Imran Ansari", "Old songs, new doubts.", 5.8, 3],
  ["nisha_pillai", "Nisha Pillai", "Psychology major. Listener first.", 5.3, 8],
  ["yash_tiwari", "Yash Tiwari", "Fresher. Still finding the library.", 4.4, 2],
  ["divya_chauhan", "Divya Chauhan", "Hostel life and homesick snacks.", 4.0, 4],
  ["manav_malhotra", "Manav Malhotra", "Reads the last page first.", 3.5, 1],
]

// Shown in every starter room; Mental Wellness adds one extra line.
export const DEFAULT_RULES = [
  "1. Be kind. Disagree with ideas, never with people.",
  "2. Stay on topic for this room.",
  "3. No spam, ads or hate.",
  "4. Keep other people's stories private.",
].join("\n")

export const EXTRA_RULES = {
  "Mental Wellness": "5. This is peer support, not professional advice. If you are in crisis, please contact a local helpline.",
}

const POE = "Poetry & Verse"
const HIN = "Hindi Sahitya"
const LATE = "Late Night Thoughts"
const CODE = "Code & Craft"
const BOOK = "Books We Love"
const CAMP = "Campus Life"
const MUS = "Music Memories"
const TRAV = "Travel Diaries"
const LET = "Letters to Myself"
const FILM = "Film & Stories"
const MIND = "Mindful Moments"
const PHIL = "Philosophy Corner"
const NAT = "Nature & Wild Places"
const FOOD = "Food Stories"
const ART = "Art & Sketches"
const STUDY = "Study Circle"
const START = "Startups & Ideas"
const HOME = "Memories of Home"
const FIC = "Short Fiction"
const WELL = "Mental Wellness"

// [room (null = anonymous Space echo), author, title or null, text, replies [[author, text], ...]]
const RAW = [
  // ---------- Poetry & Verse ----------
  [POE, "aarav_sharma", "Metro, 8:40", "The glass holds a hundred faces and not one of them is looking up. I write you a line anyway, in case someone is.", [["ishita_roy", "A line for the one person who looks up. I love this."]]],
  [POE, "ishita_roy", null, "Rain on the tin roof: the only applause I ever wanted.", [["aarav_sharma", "Short and exact. That last word lands."], ["meera_nair", "I can hear it."]]],
  [POE, "priya_menon", "untitled, again", "i keep writing about the sea\nand i have been there twice.\nmaybe it's not the sea.", []],
  [POE, "kavya_reddy", null, "Tried a haiku about Monday. Got three lines of swearing. Counts as free verse, I guess.", [["aarav_sharma", "Free verse has been through worse."]]],
  [POE, "pooja_bhatt", "Small rooms", "My grandmother's kitchen was a poem with a smell. Cardamom, smoke, someone humming off-key.", [["priya_menon", "'a poem with a smell' wow"]]],
  [POE, "imran_ansari", null, "Anyone else write better at the end of the page than the start? My first five lines are always throat-clearing.", [["aarav_sharma", "Yes. I delete the first stanza and the poem begins."], ["ishita_roy", "Same. The last line usually wants to be the first."]]],
  [POE, "meera_nair", null, "Posting my favourite line from today's notebook because it will embarrass me by Friday: 'the moon is just the sun's late reply.'", [["kavya_reddy", "Keep it. It's good."]]],

  // ---------- Hindi Sahitya ----------
  [HIN, "aarav_sharma", "चाय और चुप्पी", "कुछ शामें बस इतनी होती हैं: एक कप चाय, खुली खिड़की और वो बातें जो कही नहीं गईं।", [["tanvi_joshi", "बहुत सुंदर। 'जो कही नहीं गईं' ने सब कह दिया।"]]],
  [HIN, "tanvi_joshi", null, "Premchand ki 'Idgah' dobara padhi. Hamid ka chimta aaj bhi seene mein chubhta hai.", [["pooja_bhatt", "Wo ek chimta poori kahani hai."]]],
  [HIN, "pooja_bhatt", "Dinkar ko padhte hue", "'सिंहासन खाली करो कि जनता आती है' पहली बार पढ़ा तो लगा किसी ने कविता नहीं, आग लिख दी हो।", [["aarav_sharma", "रश्मिरथी भी पढ़िए, कर्ण का मोनोलॉग भूलने वाला नहीं।"]]],
  [HIN, "rahul_dixit", null, "Hindi ki kitabein padhne ka ek nuksaan hai: ab WhatsApp forwards ki bhasha bardaasht nahi hoti.", [["pooja_bhatt", "😂 sahi pakda."]]],
  [HIN, "meera_nair", "Mahadevi Verma ki Gillu", "Mahadevi Verma ki 'Gillu' padhi. Ek chhoti si gilahri aur aankhein bheeg gayi. Itni saadgi se bhi dukh likha ja sakta hai.", []],
  [HIN, "tanvi_joshi", null, "कॉलेज की लाइब्रेरी में आज हरिवंशराय बच्चन की 'मधुशाला' मिली, 1970 का एडिशन। पन्नों की खुशबू ही अलग है।", [["rahul_dixit", "पुरानी किताबों की महक कोई परफ्यूम नहीं बना सकता।"]]],
  [HIN, "aarav_sharma", "दो पंक्तियाँ", "रास्ते खुद को खुद ही बनाते गए\nहम बस चलते गए, लोग कहते गए।", [["pooja_bhatt", "बिल्कुल सहज और सच्ची।"]]],

  // ---------- Late Night Thoughts ----------
  [LATE, "vihaan_gupta", "2:13 AM", "Funny how the problems that felt enormous at midnight look like small, reasonable errands by breakfast.", [["aarav_sharma", "Midnight is a terrible accountant."], ["ishita_roy", "Sleep first, decide later. Hard rule, easy to forget."]]],
  [LATE, "aarav_sharma", null, "The fridge hum, the ceiling fan, my own thoughts. A strange little band that only plays after 1 AM.", []],
  [LATE, "yash_tiwari", null, "3 am and I am rethinking a sentence I said in class on Tuesday. Why does my brain keep the worst reel on loop.", [["nisha_pillai", "Everyone else forgot it by Tuesday evening, promise."], ["vihaan_gupta", "Brains are bad editors."]], true],
  [LATE, "priya_menon", "insomnia log", "Counted the ceiling cracks. 14. Counted the things I'm anxious about. Also 14. Coincidence? Probably not.", [], true],
  [LATE, "harsh_vardhan", null, "Ate maggi at 2 am and felt like a philosopher. Chef's kiss.", [["rahul_dixit", "Maggi is the unofficial food of insight."]]],
  [LATE, "kavya_reddy", null, "Night is the only time I'm brave enough to text people back.", [["imran_ansari", "And regret it at 8 am. Relatable."]]],
  [LATE, "imran_ansari", "On being awake", "A city at 3 am sounds like a big animal breathing. I can't explain it better but I like it.", []],

  // ---------- Code & Craft ----------
  [CODE, "kabir_singh", "Delete more than you add", "Today's best commit removed 212 lines and fixed a bug I had been fighting for a week. Fewer moving parts, fewer places to hide.", [["devansh_mehta", "Negative-line pull requests are the best kind."], ["arjun_patel", "Same energy as editing a paragraph."]]],
  [CODE, "devansh_mehta", null, "Rubber-duck debugging works because explaining forces you to say the assumption out loud. Mine was wrong, as usual.", [["kabir_singh", "The duck has solved more bugs than I have."]]],
  [CODE, "arjun_patel", "Off-by-one, again", "Spent 90 minutes on a bug. It was `<` instead of `<=`. I'd like to formally apologise to my laptop.", [["aditya_rao", "Every developer has this exact story, in every language."], ["arjun_patel", "Haha, I put a sticky note on my monitor now: check your operators.", 0]]],
  [CODE, "aditya_rao", null, "Unpopular opinion: your side project doesn't need a microservice architecture. One file and a database is fine for a long time.", [["kabir_singh", "Agree. Boring tech ships."], ["arjun_patel", "I learned this the hard way last semester."]]],
  [CODE, "kabir_singh", null, "Reading other people's code is the real skill nobody teaches. Writing is the easy half.", []],
  [CODE, "yash_tiwari", "Fresher question", "Genuinely asking: how do you all remember git commands? I still google 'undo last commit' every single time.", [["arjun_patel", "Everyone googles it. I have a notes file with five commands I actually use."], ["devansh_mehta", "git reflog saved my project twice. Learn that one."]]],
  [CODE, "manav_malhotra", null, "Wrote my first regex that worked on the first try. Told no one because nobody would believe me.", [["arjun_patel", "Frame it."]]],

  // ---------- Books We Love ----------
  [BOOK, "meera_nair", "Rereading", "You never read the same book twice. Rereading my favourite novel after five years, I found a different person underlining different sentences.", [["tanvi_joshi", "Same with me. The book stays, the reader changes."]]],
  [BOOK, "tanvi_joshi", null, "Currently reading: a slim book of essays, one per night. Best way I have found to end a day.", [["meera_nair", "One essay a night is a lovely ritual. Which book?"]]],
  [BOOK, "manav_malhotra", "Last page first", "Yes, I read the ending first. No, it doesn't ruin anything. I'm reading for the how, not the what.", [["pooja_bhatt", "Blasphemy. But I also do this with thrillers."], ["meera_nair", "Respect the honesty."]]],
  [BOOK, "priya_menon", null, "Library fine this month: ₹40. Worth it. The book was due on a day I was still crying at chapter 30.", []],
  [BOOK, "nisha_pillai", "Recommendation thread?", "Looking for a book that feels like a warm blanket but isn't cheesy. Anything. Fiction or not.", [["meera_nair", "'The Remains of the Day'. Quiet, sad, warm somehow."], ["tanvi_joshi", "Try anything by Ruskin Bond. Shortest path to a good mood."], ["pooja_bhatt", "Malgudi Days. Always Malgudi Days."]]],
  [BOOK, "rahul_dixit", null, "Second-hand bookstore uncle recognised me today and handed me a book without a word. It was exactly what I wanted. How.", [["ishita_roy", "Bookstore uncles are secret wizards."]]],
  [BOOK, "divya_chauhan", null, "Hostel roommate and I swap books now. Her taste is thrillers, mine is slow stuff. We're both being corrupted. Beautiful.", []],

  // ---------- Campus Life ----------
  [CAMP, "devansh_mehta", "The canteen economy", "A single plate of samosas can fund three hours of conversation, two group assignments and one friendship. Best exchange rate on campus.", [["sara_khan", "Add chai and it is a whole university."], ["kabir_singh", "Accurate economics."]]],
  [CAMP, "sara_khan", null, "Back-bench people have the best stories. Sit there once a semester, you will see.", []],
  [CAMP, "yash_tiwari", "Day 1 vs Day 90", "Day 1: I know nobody and eat alone. Day 90: I know everyone and still eat alone because I'm late to every group lunch.", [["divya_chauhan", "😂 relatable fresher energy"]]],
  [CAMP, "harsh_vardhan", null, "Attendance shortage is the only thing that makes me suddenly love 8 am lectures.", [["devansh_mehta", "Nothing motivates like a threat letter."]]],
  [CAMP, "divya_chauhan", "Fest season", "Three nights of painting banners, zero sleep, someone's guitar, someone's tears. Honestly the best week of the semester.", [["harsh_vardhan", "Fest week friends are forever friends."]]],
  [CAMP, "arjun_patel", null, "The library AC is the one reliable relationship I've had this year.", [["sara_khan", "Same. Seat near the vent is prime real estate."]]],
  [CAMP, "nisha_pillai", null, "Hot take: the best part of college is the 20 minutes between classes when everyone is just standing around, talking about nothing.", []],

  // ---------- Music Memories ----------
  [MUS, "rohan_verma", "Bus window playlist", "Every long bus ride has a song that now belongs to that road. I cannot hear it without smelling wet earth and diesel.", [["vihaan_gupta", "Songs are the best bookmarks."]]],
  [MUS, "vihaan_gupta", null, "My father's old cassette player still works. The first crackle before the song begins is part of the music now.", [["rohan_verma", "That crackle is the sound of home."]]],
  [MUS, "imran_ansari", "Rafi at 6 pm", "Papa plays Rafi every evening at exactly 6, no matter what. I used to find it boring. Now it is the sound of being safe.", [["rahul_dixit", "'Chaudhvin ka chand' hits different when it's someone's ritual."]]],
  [MUS, "harsh_vardhan", null, "Learned 'Tum Hi Ho' on guitar. Played it for my roommate. He said 'nice' and put on headphones. Fair.", [["imran_ansari", "That's honestly a review."]]],
  [MUS, "rahul_dixit", "Walkman days", "Anyone remember rewinding a cassette with a pencil? I still keep one pencil in my drawer 'just in case'.", [["imran_ansari", "Pencil rewind gang 🙌"], ["rohan_verma", "My brother broke three tapes doing this."]]],
  [MUS, "kavya_reddy", null, "Every exam season I listen to the same instrumental playlist. Now just hearing the first track makes me want to revise.", []],
  [MUS, "ananya_iyer", null, "Concert last night. Phones up everywhere and a woman in front just closed her eyes and sang. Made me put my phone away.", [["vihaan_gupta", "Good for you. Hope you remember it better."]]],

  // ---------- Travel Diaries ----------
  [TRAV, "rohan_verma", "Missed the train, found the view", "Missed the 6 AM train by two minutes. Spent the morning at a tiny station tea stall watching fog lift off the fields. Best detour so far.", [["sara_khan", "The best trips are accidents with good tea."], ["ananya_iyer", "Fog over fields, I would sketch that."]]],
  [TRAV, "sara_khan", null, "Rule I learned: eat wherever the locals queue. It has never failed me, not even once.", []],
  [TRAV, "neha_kapoor", "Kasol, off-season", "Went in November. No crowds, no cafes open, just the river and a dog that adopted me for two days. 10/10, would be adopted again.", [["rohan_verma", "Off-season is the secret. Great pick."], ["priya_menon", "I want the dog's name."]]],
  [TRAV, "neha_kapoor", null, "Packed light for the first time. One bag, one jacket, one book. I missed nothing except my own overpacking.", [["rohan_verma", "The jacket is always the MVP."]]],
  [TRAV, "aditya_rao", "Sleeper class", "Sleeper coach, a stranger's tiffin shared, three card games and a lifelong friendship by Jhansi. This is why I still book sleeper.", [["rahul_dixit", "Nothing beats a night train conversation."], ["aditya_rao", "The tiffin sharing is non-negotiable etiquette.", 0]]],
  [TRAV, "divya_chauhan", null, "My first solo trip: to a city two hours away. Felt like crossing an ocean. Highly recommend small brave steps.", [["neha_kapoor", "Proud of you. Where next?"]]],
  [TRAV, "imran_ansari", null, "Late-night highway chai, truck drivers, a radio playing something old. If I could bottle one feeling it'd be this.", []],

  // ---------- Letters to Myself ----------
  [LET, "meera_nair", "To me, five years from now", "I hope you still call your mother on Sundays, still keep one afternoon free for nothing, and still forgive yourself quickly.", [["ishita_roy", "Forgive yourself quickly. Writing that down for me too."]]],
  [LET, "ishita_roy", null, "Dear me, you worried about that conversation for three days. It lasted four minutes and went fine. Next time, start with the four minutes.", [["meera_nair", "Four minutes versus three days. Painfully true."]]],
  [LET, "priya_menon", "Dear 17-year-old me", "You will not become what you planned. It will be fine. Better, even. Stop crying over the board results; nobody asks about them after a year.", [["nisha_pillai", "I needed this letter."]], true],
  [LET, "aditya_rao", null, "Note to self: failing twice is not the same as being a failure. It's just two data points.", [["kabir_singh", "Data points, not verdicts."]]],
  [LET, "yash_tiwari", "Dear future me", "If you're reading this after graduation: did we find the thing we like? And did we ever learn to wake up before 9?", [["devansh_mehta", "Spoiler: only one of those happens."]]],
  [LET, "nisha_pillai", null, "Dear me, you don't owe everyone an explanation. 'I can't make it' is a complete sentence.", [["ishita_roy", "Screenshotting this."]]],
  [LET, "tanvi_joshi", null, "To the version of me who is scared of starting: it will be messy and then it will be yours.", []],

  // ---------- Film & Stories ----------
  [FILM, "vihaan_gupta", "The quiet scene", "The best moment in a great film is rarely the big speech. It is two people washing dishes and not saying what they mean.", [["ananya_iyer", "Yes! The silence does the acting."], ["tanvi_joshi", "Now I want to rewatch half my favourites."]]],
  [FILM, "ananya_iyer", null, "Pausing a film on a random frame and realising it could hang on a wall. Cinematographers are painters with a schedule.", []],
  [FILM, "rahul_dixit", "Old Hindi cinema", "Watched 'Anand' again. Rajesh Khanna says 'Babumoshai' and I am sobbing on my sofa at 11 pm. Again.", [["vihaan_gupta", "'Zindagi badi honi chahiye, lambi nahi.' Forever."], ["pooja_bhatt", "Hrishikesh Mukherjee never misses."]]],
  [FILM, "kavya_reddy", null, "Anyone else rewatch comfort films just to know what happens next? No surprises, only warmth.", [["vihaan_gupta", "Comfort films are emotional vitamins."]]],
  [FILM, "manav_malhotra", "Subtitles", "Started watching everything with subtitles on. Now I catch jokes I missed for years. Why did nobody tell me?", []],
  [FILM, "harsh_vardhan", null, "Hot take: a good sequel exists maybe once per decade and we all pretend otherwise.", [["vihaan_gupta", "'Godfather II' is the counter-argument. Fight me."]]],
  [FILM, "pooja_bhatt", null, "Satyajit Ray's 'Pather Panchali' made me call my grandmother straight after. No explanation, just a quiet call.", [["rahul_dixit", "That's what great films do."]]],

  // ---------- Mindful Moments ----------
  [MIND, "ishita_roy", "Three breaths", "Before opening my phone each morning I take three slow breaths and name one thing I am grateful for. Small, but the day starts softer.", [["ananya_iyer", "Trying this tomorrow."]]],
  [MIND, "ananya_iyer", null, "Washing dishes slowly, warm water, no podcast. Ten quiet minutes that reset my whole evening.", [["ishita_roy", "Dishes are secretly meditation."]]],
  [MIND, "nisha_pillai", "Notice five things", "When I spiral, I look for five things I can see, four I can touch, three I can hear. It sounds silly and works every time.", [["priya_menon", "The grounding trick! Saved me during exams."]]],
  [MIND, "neha_kapoor", null, "Switched off notifications for one afternoon. The silence was so loud I almost panicked. Then it felt like a holiday.", [["ishita_roy", "A holiday for the mind, yes."]]],
  [MIND, "priya_menon", null, "Morning tea on the balcony, no phone. Pigeons are weirdly good company.", []],
  [MIND, "manav_malhotra", null, "Walked to the shop without earphones today. Heard a bird I never knew lived near my house.", []],
  [MIND, "simran_kaur", "Kneading dough", "There's something calm about kneading dough. Hands busy, mind quiet. The roti is a bonus.", [["priya_menon", "Cooking as meditation is real."]]],

  // ---------- Philosophy Corner ----------
  [PHIL, "vihaan_gupta", "Ship of Theseus, but it's me", "Every cell, habit and opinion gets replaced over the years. What is the thread that stays 'me'? Memory? Or just the stubbornness to keep answering to the same name?", [["devansh_mehta", "I vote stubbornness."], ["aarav_sharma", "Maybe the thread is what we keep caring about."], ["vihaan_gupta", "Stubbornness as identity. I am stealing that.", 0], ["devansh_mehta", "Care is a better thread, honestly.", 1]]],
  [PHIL, "devansh_mehta", null, "If a decision feels hard because both options are good, maybe the stakes are lower than they feel.", []],
  [PHIL, "nisha_pillai", "Free will, tired version", "I don't know if free will exists, but I do know I didn't choose to be this sleepy at 4 pm.", [["vihaan_gupta", "Determinism explains my afternoon slump."]]],
  [PHIL, "aditya_rao", null, "Is ambition a virtue or just anxiety with a better LinkedIn profile?", [["kabir_singh", "Both, depending on the day."], ["pooja_bhatt", "Ambition is virtue when it includes other people."]]],
  [PHIL, "pooja_bhatt", "Small question", "What do we owe the people we've outgrown? Not a lot, maybe. But more than silence.", [["nisha_pillai", "A kind goodbye, at least."]]],
  [PHIL, "arjun_patel", null, "Kierkegaard said anxiety is the dizziness of freedom. Makes sense: I stand at an open menu for 20 minutes.", [["vihaan_gupta", "😄 Choice overload is existential."]]],
  [PHIL, "rahul_dixit", null, "Maybe wisdom is just having been wrong in enough different ways.", []],

  // ---------- Nature & Wild Places ----------
  [NAT, "rohan_verma", "Dawn on the ridge", "Reached the ridge just before sunrise. For ten minutes nothing moved except the light. I forgot to take a photo and I am glad.", [["ananya_iyer", "Some views are for memory only."]]],
  [NAT, "ananya_iyer", null, "Spotted a kingfisher by the campus pond today. A tiny flash of blue and then gone. Made my whole week.", [["rohan_verma", "Kingfishers have the best timing."]]],
  [NAT, "neha_kapoor", "Rain trek", "Rain started halfway up. We didn't turn back. Soaked, muddy, laughing, and the view from the top was worth every squelch.", [["rohan_verma", "Rain treks are the real ones."], ["divya_chauhan", "Next time take me along!"]]],
  [NAT, "kavya_reddy", null, "A tiny sparrow built a nest on my window grill. I'm now an unpaid landlord. Rent: a lot of morning chirping.", [["ananya_iyer", "Congratulations on the tenants!"]]],
  [NAT, "priya_menon", null, "Sat under the neem tree near the hostel for an hour. No one asked me for anything. 10 out of 10 recommend.", []],
  [NAT, "harsh_vardhan", "Cycling at 5 am", "The city at 5 am on a cycle: empty roads, sleepy dogs, one chai stall already open. Feels like owning the place.", [["neha_kapoor", "Earliest riders are the happiest."]]],
  [NAT, "aarav_sharma", null, "Monsoon smell hitting dry ground. There's a word for it (petrichor) but 'mitti ki khushboo' is better.", [["pooja_bhatt", "Agreed completely."]]],

  // ---------- Food Stories ----------
  [FOOD, "sara_khan", "Nani's kitchen", "She never measured anything. A pinch, a handful, 'until it smells right'. I have spent years trying to cook that smell.", [["rohan_verma", "The best recipes live in hands, not paper."]]],
  [FOOD, "rohan_verma", null, "Hot jalebi at 7 PM in a cold lane. If heaven has a street, it smells like this one.", [["sara_khan", "Add rabri and I am there."]]],
  [FOOD, "simran_kaur", "Sunday rajma", "Slow-cooked rajma, hot rice, a spoon of ghee. If you're sad on a Sunday this is the cure and I will not be taking questions.", [["divya_chauhan", "Making this tomorrow."], ["sara_khan", "Add pickle. Don't argue."]]],
  [FOOD, "divya_chauhan", null, "Mess food rating this week: 3/10 Monday, 1/10 Tuesday, 7/10 Friday (they did paneer). Peaks and valleys.", [["yash_tiwari", "Paneer Friday is the only reason we survive."]]],
  [FOOD, "simran_kaur", null, "Tried making my mom's chai today. Tasted nothing like hers. Called her. She said, 'you didn't add patience.'", [["priya_menon", "Wholesome and savage."]]],
  [FOOD, "harsh_vardhan", "Street momos", "Cheap momo stall outside the metro > any 'premium dimsum' bistro. I will die on this hill.", [["sara_khan", "Red chutney or nothing."]]],
  [FOOD, "imran_ansari", null, "Ammi's biryani on Eid is the only dish that makes me emotional. The rest are just food.", []],

  // ---------- Art & Sketches ----------
  [ART, "ananya_iyer", "Ugly first pages", "Gave myself permission to fill one whole sketchbook with bad drawings. Page forty looked better than page one. That is the whole secret.", [["meera_nair", "Permission to be bad is underrated."]]],
  [ART, "kavya_reddy", null, "Tried drawing my hands today. Hands are brutally honest teachers.", [["ananya_iyer", "Everyone's first hands look like gloves full of sausages. Keep going."]]],
  [ART, "kavya_reddy", "Midnight painting", "Painted a blue wall at 1 am with nothing but acrylics and bad lighting. In daylight it looks even better. Lucky accident.", [["priya_menon", "Show us!"]]],
  [ART, "priya_menon", null, "Doodling in the margins of my notes is the only reason I attend half my lectures.", [["ananya_iyer", "Margins are the real canvas."]]],
  [ART, "manav_malhotra", null, "Bought a cheap watercolour set. Realised I can't paint. Will keep painting. Seems fair.", [["kavya_reddy", "That is exactly how everyone starts."]]],
  [ART, "tanvi_joshi", "Pencil on paper", "A single pencil, ten minutes, the view from my window. No filters, no undo. There's something peaceful in that.", []],
  [ART, "ishita_roy", null, "Color theory tip I'm still learning: use less colour than you think, and let one thing glow.", [["ananya_iyer", "So true. Restraint is a skill."]]],

  // ---------- Study Circle ----------
  [STUDY, "devansh_mehta", "The 25-minute rule", "Twenty-five minutes on, five off, phone in another room. Not magic, but the guilt of 'I should be studying' finally disappeared.", [["kabir_singh", "Works for coding sessions too."]]],
  [STUDY, "kabir_singh", null, "Explain the chapter to an empty chair before the exam. Wherever you stumble is exactly what to revise.", [["devansh_mehta", "Trying it tonight."]]],
  [STUDY, "yash_tiwari", "Syllabus panic", "Opened the syllabus. Closed the syllabus. Opened the fridge. Closed the fridge. Repeated both for 40 minutes.", [["devansh_mehta", "The classic."], ["arjun_patel", "Start with 10 minutes on the easiest chapter. Momentum is real."]], true],
  [STUDY, "nisha_pillai", null, "Study tip: write the answer in your own words, then compare to the book. Memorising is slower than understanding.", []],
  [STUDY, "arjun_patel", "Group study works", "Study groups only work if there's one person who actually studies, one who asks questions, and one who brings snacks. We have all three.", [["sara_khan", "The snack person is the real MVP."]]],
  [STUDY, "pooja_bhatt", null, "Tip for literature students: summarise each chapter in two sentences. If you can't, you haven't read it.", [["tanvi_joshi", "Brutal but true."]]],
  [STUDY, "divya_chauhan", null, "Exam tomorrow. Currently highlighting the entire page in yellow. This is fine.", [["devansh_mehta", "If everything is highlighted, nothing is."]]],

  // ---------- Startups & Ideas ----------
  [START, "kabir_singh", "Talk to ten people first", "Before building anything, I now talk to ten people who might use it. Seven of my last ideas died in those conversations and saved me months.", [["devansh_mehta", "Cheapest way to kill a bad idea."]]],
  [START, "devansh_mehta", null, "Idea: a notes app that only shows what you wrote a year ago today. Anyone building something similar?", [["kabir_singh", "Sounds like a perfect weekend project."], ["meera_nair", "I would use that every day."]]],
  [START, "aditya_rao", "Two failures later", "First startup died of no customers. Second died of no co-founder chemistry. Third idea: start with a friend and ten paying users. Wish me luck.", [["kabir_singh", "Good luck. Chemistry is underrated."], ["arjun_patel", "Take notes publicly. We'll cheer."]]],
  [START, "arjun_patel", null, "Anyone want to build a campus second-hand book exchange? Tired of buying ₹600 textbooks for one semester.", [["divya_chauhan", "YES. Count me in."], ["yash_tiwari", "I'd list 6 books tomorrow."]]],
  [START, "simran_kaur", "Tiffin idea", "My roommates keep asking me to make tiffins. Is a small hostel tiffin service a business or just me being overworked?", [["aditya_rao", "Test it with ten people for a month, then decide."], ["sara_khan", "I'd pay for homemade food at 100 a day."]]],
  [START, "harsh_vardhan", null, "Learned that 'idea guy' is not a job title. Execution is.", []],
  [START, "manav_malhotra", null, "Question: how do you pick a co-founder? Skill? Trust? Both? I keep getting excited about people who are bad at deadlines.", [["aditya_rao", "Trust first. Skills you can learn."]]],

  // ---------- Memories of Home ----------
  [HOME, "meera_nair", "Sunday smells", "Sunday meant incense in the morning, pressure cooker whistles by noon and the cricket commentary nobody was really following.", [["sara_khan", "My Sundays were exactly this."]]],
  [HOME, "sara_khan", null, "Our old street had one lamp that flickered. Twenty years later I still look for it in every new city.", []],
  [HOME, "rahul_dixit", "Terrace evenings", "Every summer evening the whole mohalla sat on terraces. Cards, gossip, someone's radio. No screens. I miss that more than I admit.", [["imran_ansari", "Terrace culture was underrated."]]],
  [HOME, "simran_kaur", null, "Mom packs more food than I can eat every time I leave home. It's not food. It's 'I miss you' in a steel box.", [["divya_chauhan", "Mine does too. The pickle is a love letter."]]],
  [HOME, "imran_ansari", "Eid mornings", "The smell of sheer khurma, new kurtas and the cousins all talking at once. No place has ever felt as loud and as safe.", [["sara_khan", "Beautiful."]]],
  [HOME, "divya_chauhan", null, "Called home after three days. Dad answered, said 'ok ok ok, here's your mother.' That's his I love you.", [["simran_kaur", "Dads speak in short sentences."]]],
  [HOME, "priya_menon", null, "Old photo albums smell like a time machine. Found one of my grandfather in a hat and now I have questions.", []],

  // ---------- Short Fiction ----------
  [FIC, "tanvi_joshi", "Opening line", "The lighthouse keeper had not seen a ship in nine years, yet every night he polished the lamp as if one were late.", [["meera_nair", "Please write the next paragraph."], ["aarav_sharma", "Hooked."]]],
  [FIC, "meera_nair", null, "She kept the unsent letters in a biscuit tin. The day the tin was full, she finally walked to the post box.", [["tanvi_joshi", "That ending beat is perfect."]]],
  [FIC, "pooja_bhatt", "Flash fiction (50 words)", "He bought two tickets out of habit. At the gate he realised, smiled, and gave the other seat to the whole empty bus. They rode in the afternoon light, together alone.", [["tanvi_joshi", "Oh, that stung nicely."]]],
  [FIC, "manav_malhotra", null, "Story seed: a town where everyone's shadow is a few seconds late. Anyone want to write this with me?", [["tanvi_joshi", "I'm in. Send me the first page."]]],
  [FIC, "aarav_sharma", null, "'Remember me,' said the last streetlight, flickering, and the road, who had forgotten everyone, nodded.", []],
  [FIC, "kavya_reddy", "Draft 3", "Rewrote the same short story three times. Same ending. Maybe the ending was never the problem.", [["pooja_bhatt", "Maybe the beginning was."]]],
  [FIC, "priya_menon", null, "Wrote a 300-word story on my phone during a boring lecture. It's my best piece of the month. Sorry, professor.", []],

  // ---------- Mental Wellness ----------
  [WELL, "ishita_roy", "Not every day is a good day", "A reminder to myself and anyone reading: a slow, low-energy day is not a failure. Rest is part of the work.", [["tanvi_joshi", "Needed this today. Thank you."]], true],
  [WELL, "tanvi_joshi", null, "Talking to a friend for ten minutes did more than two hours of overthinking. Reach out sooner than you think you should.", [["ishita_roy", "Always worth the awkward first sentence."]]],
  [WELL, "nisha_pillai", "Check-in", "Quiet reminder: drink water, eat something real, step outside for five minutes. Not a cure. A start.", [["priya_menon", "Doing all three right now."]]],
  [WELL, "priya_menon", null, "Therapy week 3: learned that 'I'm fine' can be a sentence that hides an entire paragraph.", [["nisha_pillai", "Proud of you for going."]], true],
  [WELL, "yash_tiwari", "Homesick", "Ten days in the hostel and the quiet at night is the hardest part. Is it okay if this doesn't get better immediately?", [["divya_chauhan", "Completely okay. It got easier for me around week four."], ["nisha_pillai", "It's normal. Call someone at home each night, even for 5 minutes."], ["yash_tiwari", "Thank you both. Calling home tonight.", 1]], true],
  [WELL, "manav_malhotra", null, "Learned today that saying no is a boundary, not a rejection.", []],
  [WELL, "kabir_singh", null, "Burnout doesn't announce itself. It just makes your favourite things feel like chores. Taking a proper break this weekend.", [["ishita_roy", "Good call. Rest is productive too."]]],

  // ---------- Space (anonymous) ----------
  [null, "aarav_sharma", null, "I told my sister the truth tonight and the world did not end. It just got lighter.", [["ishita_roy", "Lighter is the right word."]]],
  [null, "meera_nair", null, "I still keep a voice note from someone who is no longer in my life. I do not listen to it. I just need to know it exists.", []],
  [null, "kabir_singh", null, "I smiled through a whole interview while quietly panicking. Got the job. Still do not know how.", [["devansh_mehta", "Calm outside, chaos inside. Respect."], ["kabir_singh", "Chaos inside is exactly right. Thank you!", 0]]],
  [null, "ananya_iyer", null, "Somebody on the bus gave me their seat without a word. I thought about it all day.", []],
  [null, "rohan_verma", null, "Some friendships end without a fight. Two people just stop texting first. I miss mine.", [["sara_khan", "A text can still fix it. Send one."]]],
  [null, "ishita_roy", null, "I am proud of myself today for doing something small: I answered the phone call I had been avoiding.", [["vihaan_gupta", "That is not small."]]],
  [null, "vihaan_gupta", null, "I rewrote the same message eleven times and sent 'hey'. Honest to a fault.", []],
  [null, "sara_khan", null, "Home food on the first day back from a hostel. I almost cried over a plain dal.", [["meera_nair", "Plain dal is the most emotional dish."]]],
  [null, "devansh_mehta", null, "Failed a paper I really tried for. Not looking for advice, just saying it out loud.", [["kabir_singh", "Heard. It says nothing about your worth."], ["ishita_roy", "Sending you strength."]]],
  [null, "tanvi_joshi", null, "I wrote a poem for someone and never showed them. It is still the best thing I have written.", []],
  [null, "priya_menon", null, "my phone's storage is full of screenshots of conversations i'm afraid to forget", []],
  [null, "arjun_patel", null, "Pretended to understand a joke for fifteen minutes in a group. Laughed at the right moments. Still no idea what was funny.", [["harsh_vardhan", "Skill: social camouflage."]]],
  [null, "neha_kapoor", null, "Every time I feel stuck in a city, I look at the sky. Same sky as home. It helps, slightly.", []],
  [null, "rahul_dixit", null, "My dad doesn't say much. But he always fills my water bottle before I leave. I only understood this last year.", [["simran_kaur", "That is love, in the language he knows."]]],
  [null, "simran_kaur", null, "Cooked for twelve people today and nobody noticed I hadn't eaten. Then my friend quietly kept a plate for me. Tears.", []],
  [null, "aditya_rao", null, "Failed for the second time and told no one at home. Pretending is exhausting.", [["nisha_pillai", "You don't have to carry it alone. Even one person is enough to tell."]]],
  [null, "pooja_bhatt", null, "I always overthink what to reply to 'how are you'. Today I said 'actually not great' and the person stayed for an hour.", [["ishita_roy", "Honesty opens doors."]]],
  [null, "harsh_vardhan", null, "Gym at 6 am is 20% fitness, 80% 'I proved to myself I can show up'.", [["devansh_mehta", "Showing up is half of everything."]]],
  [null, "kavya_reddy", null, "I paint better when I'm sad. Not sure how I feel about that.", [["tanvi_joshi", "Sad is a good teacher but a bad landlord. Visit, don't live there."]]],
  [null, "imran_ansari", null, "Heard my late grandfather's favourite song in a shop. Stood there, pretending to look at spices. The shopkeeper pretended not to notice.", []],
  [null, "nisha_pillai", null, "The people who listen the most often get listened to the least. If that's you, I see you.", [["ishita_roy", "Thank you. Needed this."]]],
  [null, "yash_tiwari", null, "First time in a new city, I eat dinner on the footpath because the restaurant felt too crowded. It was the best meal in weeks.", []],
  [null, "divya_chauhan", null, "My roommate leaves a tiny sticky note on my desk every exam day. 'You've got this.' I've kept all of them.", [["simran_kaur", "Hold onto that roommate."]]],
  [null, "manav_malhotra", null, "Told a lie once to avoid an awkward conversation. Spent weeks keeping up the story. Never again.", []],
  [null, "aarav_sharma", null, "Walked home the long way just to hear one more song. No regrets.", []],
  [null, "meera_nair", null, "My grandmother's handwriting on an old recipe card is the most beautiful font in the world.", [["sara_khan", "No font will ever beat it."]]],
  [null, "kabir_singh", null, "Anyone else feel guilty when they rest? Trying to unlearn it, one Sunday at a time.", [["ishita_roy", "Rest is not a reward. It is maintenance."]]],
  [null, "ananya_iyer", null, "I like cities best at 5 AM: the street sweepers, the first buses, nobody asking me to be anyone yet.", []],
  [null, "rohan_verma", null, "Told a stranger on a train that I was nervous about a new chapter. He said: 'Everyone is, that is how you know it matters.'", [["tanvi_joshi", "Strangers on trains give the best advice."]]],
  [null, "ishita_roy", null, "I forgave someone today who never apologised. It was for me, not for them.", []],
  [null, "vihaan_gupta", null, "A childhood friend remembered my favourite song after fifteen years. Some people file you in their heart, not their calendar.", []],
  [null, "sara_khan", null, "Cooked for myself properly tonight, plated and everything. Treat yourself like a guest you want to impress.", [["meera_nair", "Doing this tomorrow."]]],
  [null, "devansh_mehta", null, "I am learning that 'I do not know yet' is a complete and honourable sentence.", []],
  [null, "tanvi_joshi", null, "Tonight the moon looked so close that I said thank you out loud, to nobody in particular.", [["aarav_sharma", "I saw it too. Thank you from me as well."]]],
  [null, "priya_menon", null, "Does anyone else feel strangely nostalgic for places they've never been? Like a song for a city you can't name.", [["imran_ansari", "Yes. Maybe it's nostalgia for who we'd be there."]]],
  [null, "arjun_patel", null, "Learned to cook one dish well this year. Surprisingly, it changed how I see myself. Small skills, big confidence.", []],
  [null, "neha_kapoor", null, "I miss being bored as a kid. Real, endless, nothing-to-do boredom. Best creative engine ever.", [["rahul_dixit", "Summer holidays were different."]]],
  [null, "rahul_dixit", null, "I replied 'haha' to a message that deserved a real answer. Feeling guilty three days later.", [["pooja_bhatt", "Send the real answer. It's not too late."]]],
  [null, "simran_kaur", null, "My neighbour's aunty feeds every stray in the lane. I've never seen her get thanked. I thank her silently every morning.", []],
  [null, "aditya_rao", null, "Just realised my biggest fear isn't failing. It's being ordinary. Working on making peace with ordinary.", [["vihaan_gupta", "Ordinary days are most of what a life is made of."]]],
  [null, "pooja_bhatt", null, "A stranger's kindness: someone held the lift for me while I ran with an overflowing bag. Went back to my room smiling for no reason.", []],
  [null, "harsh_vardhan", null, "Group chats are 2% information and 98% 'who's coming'. Yet I still check them every ten minutes.", [["arjun_patel", "😂 the cycle continues."]]],
  [null, "kavya_reddy", null, "Painted over my own painting today. Sometimes erasing is also making.", []],
  [null, "imran_ansari", null, "A ghazal at midnight and I forgot to be tired. Music is the only medicine that doesn't taste bad.", [["rahul_dixit", "Which ghazal? Please share."]]],
  [null, "nisha_pillai", null, "Today a friend said 'thanks for asking' and I realised how rare it is to be asked.", []],
  [null, "yash_tiwari", null, "Got lost in the campus for 20 minutes on day 4. Told no one. Pretended to be sightseeing.", [["divya_chauhan", "Everyone does this, don't worry!"]]],
  [null, "divya_chauhan", null, "Last night hostel power cut. Everyone came out in the corridor with torches and told stories. Best night of the semester.", []],
  [null, "manav_malhotra", null, "Found an old notebook of mine from school. The 'future plans' page made me smile. I'm none of those things, and fine with it.", [["meera_nair", "Old notebooks are tiny time capsules."]]],
]

// replies: [writer, text, index of the reply being answered (optional)]
export const ECHOES = RAW.map(([room, by, title, text, replies, anonymous]) => ({
  room,
  by,
  title,
  text,
  replies: replies.map(([replyBy, replyText, replyTo]) => ({ by: replyBy, text: replyText, replyTo })),
  anonymous: room === null || anonymous === true,
}))

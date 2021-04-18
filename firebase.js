var firebaseConfig = {
	apiKey: "AIzaSyC8vVFA61-DQrVAaBPX1Y__FHh8bjjv0PY",
	authDomain: "supercards-7c0c7.firebaseapp.com",
	projectId: "supercards-7c0c7",
	storageBucket: "supercards-7c0c7.appspot.com",
	messagingSenderId: "714584125901",
	appId: "1:714584125901:web:5897ea307e60421f701484",
	measurementId: "G-1TBR432TDQ"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const fs = firebase.firestore;
let userData = db.collection("exampleUser");  //change to user id

// auth -----
auth.onAuthStateChanged(user => {
	if (user) {
		start(user.uid);
	}
	else {
		openLogin();
	}
});

function signUp(){
	auth.createUserWithEmailAndPassword(
		document.getElementById("email").value,
		document.getElementById("pass").value)
	.then(() => {
		generateDefault();
		console.log("signed up");
		closePopup();
	})
	.catch(e => console.log(e.message));
}

function logIn(){
	auth.signInWithEmailAndPassword(
		document.getElementById("email").value,
		document.getElementById("pass").value
	)
	.then(() => {
		console.log("logged in");
		closePopup();
	})
	.catch(e => console.log(e.message));
}

function logOut(){
	auth.signOut();
	console.log("Signed out");
}

// firestore -----
async function getDecks(){
	const decks = await userData.doc("decks").get();
	if (decks.exists)
		return decks.data();
	console.log("no decks!");
	return false;
}

//get cards from a given deck
async function getDeck(name){
	const deck = await getDecks();
	return deck[name];
}

async function getCards(){
	const cards = await userData.doc("cards").get();
	if (cards.exists)
		return cards.data();
	console.log("no decks!");
	return false;
}

async function getFields(type){
	const cards = await getCards();
	return cards[type].fields;
}

async function getTemplates(type){
	const cards = await getCards();
	return cards[type].templates;
}

async function getTemplate(type, template){
	const cards = await getCards();
	return cards[type].templates[template];
}

//todo prevent overwriting of decks w/ same name by adding (1), (2), etc to name
function newDeck(){
	let deck = {};
	deck[document.getElementById("nameField").value.toLowerCase()] = [];
	console.log(deck);
	userData.doc("decks").update(deck);
	closePopup();
	showDecks();
}

async function newCard(deck, type, template, data){
	let add = {};
	add[deck] = fs.FieldValue.arrayUnion({
		type: type,
		template: template,
		...data,
	});
	console.log(add);
	userData.doc("decks").update(add);
}

function generateDefault(){
	console.log(userData);
	userData.doc("cards").set({
		basic: {
			fields: ["front", "back"],
			templates: {
				basic: ["{{front}}", "{{back}}"]
			}
		},
		reversed: {
			fields: ["front", "back"],
			templates: {
				basic: ["{{front}}", "{{back}}"],
				reversed: ["{{back}}", "{{front}}"]
			}
		}
	});
	userData.doc("decks").set({
		welcome: [
			{
				type: "basic",
				template: "basic",
				front: "Welcome to Supercards! This is the front of a supercard!\nClick the button below to reveal the back.",
				back: "Well done!\n\nPress the first button below to mark this card as correct.\nPress the second button to go back to the front of the card.\nPress the third button to mark this card as incorrect (we'll go back and review it later)."
			},
			{
				type: "reversed",
				template: "basic",
				front: "This card uses a basic template, but you can make more to suit your needs.\nThe next card will use a reversed template, and you'll see these sides in the opposite order.\nClick the button to continue.",
				back: "You can make multiple cards with the same information in different arrangements!\nJust keep clicking the first button."
			},
			{
				type: "reversed",
				template: "reversed",
				front: "This card uses a basic template, but you can make more to suit your needs.\nThe next card will use a reversed template, and you'll see these sides in the opposite order.\nClick the button to continue.",
				back: "You can make multiple cards with the same information in different arrangements!\nJust keep clicking the first button."
			},
			{
				type: "basic",
				template: "basic",
				front: "Wasn't that cool?",
				back: "Answer: Yes."
			},
			{
				type: "basic",
				template: "basic",
				front: "Click the three bars in the top left to open the menu.\nFrom the menu, you can view your decks, add cards, manage your card templates, or log out.",
				back: "I've taught you all I can. Have fun making your own supercards!"
			}
		]
	});
}

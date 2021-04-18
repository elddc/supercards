//open login screen
function openLogin(){
	if (menuOpen)
		toggleMenu();
	popup.style.display = "grid";
	popup.innerHTML = Mustache.render(tLogin, {
		title: "Log In",
		onClick: "logIn()",
		other: "Sign Up",
		otherClick: "openSignup()"
	});
}

//open signup screen
function openSignup(){
	if (menuOpen)
		toggleMenu();

	popup.style.display = "grid";
	popup.innerHTML = Mustache.render(tLogin, {
		title: "Sign Up",
		onClick: "signUp()",
		other: "Log In",
		otherClick: "openLogin()"
	});
}

function closePopup(){
	popup.innerHTML = "";
	popup.style.display = "none";
}

function openNewDeck(){
	/* rename functionality (todo later)
	let deckInfo = {
		title: "New Deck",
		fields: ["name"],
		onclick: "newDeck()",
		buttonText: "Create New Deck"
	}
	if (name !== ''){
		deckInfo.title = name;
		//todo...
	}*/
	popup.style.display = "grid";
	popup.innerHTML = Mustache.render(tForm, {
		title: "New Deck",
		fields: ["name"],
		bottom: Mustache.render(
			document.getElementById("tTwoButtons").innerHTML,
			{
				onclick: "newDeck()",
				buttonText: "Create New Deck",
				container: "margin-top: -3vh;"
			}
		)
	});
}


function openNewTemplate(){
	/* rename functionality (todo later)
	let deckInfo = {
		title: "New Deck",
		fields: ["name"],
		onclick: "newDeck()",
		buttonText: "Create New Deck"
	}
	if (name !== ''){
		deckInfo.title = name;
		//todo...
	}*/
	popup.style.display = "grid";
	popup.innerHTML = Mustache.render(tForm, {
		title: "New Template",
		fields: ["name"],
		bottom: Mustache.render(
			document.getElementById("tTwoButtons").innerHTML,
			{
				onclick: "newTemplate(fCard.value)",
				buttonText: "Create New Template",
				container: "margin-top: -3vh;"
			}
		)
	});
}

function openNewCard(){
	/* rename functionality (todo later)
	let deckInfo = {
		title: "New Deck",
		fields: ["name"],
		onclick: "newDeck()",
		buttonText: "Create New Deck"
	}
	if (name !== ''){
		deckInfo.title = name;
		//todo...
	}*/
	popup.style.display = "grid";
	popup.innerHTML = Mustache.render(tForm, {
		title: "New Card",
		fields: ["name", "fields"],
		bottom: Mustache.render(
			document.getElementById("tTwoButtons").innerHTML,
			{
				onclick: "newCardType()",
				buttonText: "Create New Card Type",
				container: "margin-top: -3vh;"
			}
		)
	});
}

function newCardType(){
	let name = document.getElementById("nameField").value;
	let fields = document.getElementById("fieldsField").value.split(',');
	console.log(fields);
	let type = {};
	type[name] = {
		fields: fields,
		templates: {basic: [fields[0], fields[1]]},
	};
	userData.doc("cards").update(type);
	openEditTemplates();
}

async function newTemplate(card, name){
	console.log(card, name);
	let type = {};
	let templates = await getTemplates(card);
	templates[name] = ["", ""];
	type[card] = {
		templates: templates,
	};
	userData.doc("cards").update(type);
	openEditTemplates();
}

async function showDecks(){
	saveProgress();
	const deckNames = Object.keys(await getDecks()).reverse();  //order old to new
	main.innerHTML = Mustache.render(tDecks, {decks: deckNames});
}

function saveProgress(){
	if (currentDeck()){ //from study page
		let deck = currentDeck();
		deckProgress[deck] = currentCard - 1;
		reviewProgress[deck] = toReview;
	}
	//reset variables
	cards = null;
	currentCard = 0;
	deckSize = 0;
}

async function reviewDeck(name){
	main.innerHTML = Mustache.render(tReview);
	card = document.getElementById("card");
	correctButton = document.getElementById("correctButton");
	incorrectButton = document.getElementById("incorrectButton");

	pageInfo = null;

	if (name in deckProgress){
		currentCard = deckProgress[name];
		toReview = reviewProgress[name];
	} else {
		currentCard = -1;
		toReview = [];
	}
	cards = await getDeck(name);
	deckProgress[name] = -1;    //being reviewed
	deckSize = cards.length;
	if (deckSize > 0)
		nextCard();
	else
		emptyMessage();
}

async function nextCard(){
	currentCard++;
	correctButton.classList.add("hide");
	incorrectButton.classList.add("hide");

	console.log(toReview)

	let i = currentCard;
	if (i >= deckSize) {
		i = currentCard - deckSize; //index in toReview
		console.log(i);
		if (i >= toReview.length){
			doneMessage();
			return;
		}
		i = toReview[i];
		console.log(i);
		console.log(cards[i]);
	}

	const {type, template, ...data} = cards[i];
	renderCard(type, template, data);
}

function currentDeck(){
	return Object.keys(deckProgress).find(deck => deckProgress[deck] < 0)
}

function emptyMessage(){
	let msg = 'Uh oh! There are no cards in this deck!<br>';
	msg += Mustache.render(tButton, {
		text: "Add Cards to " + currentDeck(),
		onclick: "openAddCards('" + currentDeck() + "')",
		class: "border-button med",
		style: "margin-top: 2vh;"
	});
	main.innerHTML = Mustache.render(tMessage, {title: "Empty Deck", message: msg})
}

function doneMessage(){
	let current = currentDeck();
	deckProgress[current] = 0;
	toReview = [];
	delete reviewProgress[current];
	let msg = 'Congrats! You finished your <i class="blue">' + current + "</i> deck!<br>";
	msg += Mustache.render(tButton, {
		text: "Back to Decks",
		onclick: "showDecks()",
		class: "border-button med",
		style: "margin-top: 2vh;"
	});
	main.innerHTML = Mustache.render(tMessage, {title: "Done", message: msg})
}

//params: card type, template name, fields
async function renderCard(type, template, data, display=true){
	const cardTemplate = await getTemplate(type, template);

	//todo test if data keys match card fields
	front = Mustache.render(cardTemplate[0], data);
	back = Mustache.render(cardTemplate[1], data);
	if (display){
		card.innerHTML = front;
		isFront = true;
	}
}

function flip(){
	card.innerHTML = isFront ? back : front;
	correctButton.classList.toggle("hide");
	incorrectButton.classList.toggle("hide");
	isFront = !isFront;
}

function mark(correct){
	if (!correct)
		toReview.push((currentCard < deckSize) ? currentCard : toReview[currentCard - deckSize]);
	nextCard();
}

async function openAddCards(deck, type="basic", template="basic"){
	if (!pageInfo) {
		console.log("fill pageInfo");
		pageInfo = {
			decks: Object.keys(await getDecks()).reverse(),
			cards: Object.keys(await getCards())
		};
	}
	const fields = await getFields(type);
	console.log(fields);
	let x = {};
	for (const f of fields){
		x[f] = f;
	}
	pageInfo.input = Mustache.render(tForm, {fields: fields});
	pageInfo.templates = Object.keys(await getTemplates(type));

	await renderCard(type, template, x, false);
	pageInfo.frontSide = front;
	pageInfo.backSide = back;
	console.log(pageInfo.frontSide);

	main.innerHTML = Mustache.render(tAdd, pageInfo);

	form = document.getElementById("form");
	fDeck = document.getElementById("fDeck");
	fCard = document.getElementById("fCard");
	fTemplate = document.getElementById("fTemplate");

	pFront = document.getElementById("preview-front");
	pBack = document.getElementById("preview-back");

	fDeck.value = deck; //deck name, or empty if no deck name given
	fCard.value = type;
	fTemplate.value = template;
	form.addEventListener('change', update)
}

function getFormData(){
	let data = {};
	const formData = new FormData(form);
	formData.forEach((value, key) => {
		data[key] = (value !== "") ? value : key;
	});
	return data;
}

async function update(){
	await renderCard(fCard.value, fTemplate.value, getFormData(), false);

	pFront.innerHTML = front;
	pBack.innerHTML = back;
}

async function changeCardType(){
	openAddCards(fDeck.value, fCard.value, fTemplate.value);
}

function changeTemplate(){
	update();
}


async function update(){
	await renderCard(fCard.value, fTemplate.value, getFormData(), false);

	pFront.innerHTML = front;
	pBack.innerHTML = back;
}

async function changeCardTypeT(){
	editTemplates(fCard.value, fTemplate.value);
}

function changeTemplateT(){
	update();
}

function addCard(){
	newCard(fDeck.value, fCard.value, fTemplate.value, getFormData());
	openAddCards(fDeck.value, fCard.value, fTemplate.value);
}


function openEditTemplates(){
	pageInfo = null;
	editTemplates();
}

async function editTemplates(type="basic", template="basic"){
	if (!pageInfo) {
		console.log("fill pageInfo");
		pageInfo = {
			cards: Object.keys(await getCards())
		};
	}
	const fields = await getFields(type);
	console.log(fields);
	let x = {};
	for (const f of fields){
		x[f] = f;
	}
	const arr = await getTemplate(type, template);
	pageInfo.input = Mustache.render(tArea, {front: arr[0], back: arr[1]});
	pageInfo.templates = Object.keys(await getTemplates(type));

	await renderCard(type, template, x, false);
	pageInfo.frontSide = front;
	pageInfo.backSide = back;
	console.log(pageInfo.frontSide);

	main.innerHTML = Mustache.render(tEdit, pageInfo);

	form = document.getElementById("form");
	fDeck = document.getElementById("fDeck");
	fCard = document.getElementById("fCard");
	fTemplate = document.getElementById("fTemplate");

	pFront = document.getElementById("preview-front");
	pBack = document.getElementById("preview-back");

	fCard.value = type;
	fTemplate.value = template;
	form.addEventListener('change', update)
}

function start(user){
	userData = db.collection(user);
	generateDefault();
	showDecks();
}

function toggleMenu(){
	if (menuOpen){
		for (let i = 0; i < bars.length; i++){
			bars[i].classList.toggle("transition-first");
			bars[i].classList.toggle("transition-second");
			wrap[i].classList.toggle("transition-first");
			wrap[i].classList.add("transition-second");
			bars[i].style.backgroundColor = "var(--blue)";
		}

		menuOpen = false;
		menu.style.flex = "0";
		menu.classList.toggle("first");
		menu.classList.toggle("second");
	}
	else {
		for (let i = 0; i < bars.length; i++){
			bars[i].classList.toggle("ftransition-first");
			bars[i].classList.toggle("transition-second");
			wrap[i].classList.toggle("transition-first");
			wrap[i].classList.toggle("transition-second");
			bars[i].style.backgroundColor = "white";
		}

		menuOpen = true;
		menu.style.flex = "1";
		menu.classList.toggle("second");
		menu.classList.toggle("first");
	}
	document.getElementById("pages").classList.toggle("hide");
	menuButton.classList.toggle("change");
}

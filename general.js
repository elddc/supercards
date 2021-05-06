//Opens login/auth popup    todo display error messages
//0: signup (or anything other than 1 tbh)
//1: login
function openAuth(type){
	if (menuOpen)
		toggleMenu();
	popup.style.display = "grid";

	if (type === 1)
		popup.innerHTML = Mustache.render(tLogin, {
			title: "Log In",
			onClick: "logIn()",
			other: "Sign Up",
			otherClick: "openAuth(0)"
		});
	else
		popup.innerHTML = Mustache.render(tLogin, {
			title: "Sign Up",
			onClick: "signUp()",
			other: "Log In",
			otherClick: "openAuth(1)"
		});
}

//clear and close popup window
function closePopup(){
	popup.innerHTML = "";
	popup.style.display = "none";
}

//open new deck creation popup
function openNewDeck(){
	/* todo rename deck functionality
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

//open new template creation popup
function openNewTemplate(){
	//todo rename functionality
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

//open new card creation popup
function openNewCard(){
	//todo rename functionality
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

//create new type of card
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

//create new template
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

//show deck list
async function showDecks(){
	saveProgress();
	const deckNames = Object.keys(await getDecks()).reverse();  //order old to new
	main.innerHTML = Mustache.render(tDecks, {decks: deckNames});
}

//open add cards page
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
	let x = {}; //todo better variable name
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

//get data from form
//might be causing form submit bugs?
function getFormData(){
	let data = {};
	const formData = new FormData(form);
	formData.forEach((value, key) => {
		data[key] = (value !== "") ? value : key;
	});
	return data;
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


//FIXME
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
	//generateDefault();    //testing only: reset acct
	showDecks();
}

//open/close menu
function toggleMenu(){
	let bg;
	if (menuOpen){
		bg = "var(--blue)";
		menuOpen = false;
		menu.style.flex = "0";
	}
	else {
		bg = "white";
		menuOpen = true;
		menu.style.flex = "1";
	}
	console.log(bg);

	for (let i = 0; i < bars.length; i++){
		bars[i].classList.toggle("transition-first");
		bars[i].classList.toggle("transition-second");
		wrap[i].classList.toggle("transition-first");
		wrap[i].classList.toggle("transition-second");
		bars[i].style.backgroundColor = bg;
	}
	menu.classList.toggle("first");
	menu.classList.toggle("second");
	document.getElementById("pages").classList.toggle("hide");
	menuButton.classList.toggle("change");
}

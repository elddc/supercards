
//save review progress
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

//basic review
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

//go to next card
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

//get deck being reviewed
function currentDeck(){
	return Object.keys(deckProgress).find(deck => deckProgress[deck] < 0)
}

//display message if deck empty
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

//display message when review of deck done
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

//flip card
function flip(){
	card.innerHTML = isFront ? back : front;
	correctButton.classList.toggle("hide");
	incorrectButton.classList.toggle("hide");
	isFront = !isFront;
}

//mark card as correct/incorrect (dismiss/put in toReview)
function mark(correct){
	if (!correct)
		toReview.push((currentCard < deckSize) ? currentCard : toReview[currentCard - deckSize]);
	nextCard();
}

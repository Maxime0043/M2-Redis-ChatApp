<script setup>
	import { ref, onMounted, watch, computed } from 'vue'
	import { useRouter } from "vue-router"
	import { DateTime } from 'luxon'
	import { useUser } from "../stores/user"
	import { io } from "socket.io-client";
	import { Tooltip } from 'bootstrap'

	// Socket
	let socket = io("ws://localhost:3000");

	// Router
	const router = useRouter()

	// User
	const { username, userId, logOut } = useUser()

	// Refs
	const rooms = ref([])
	const roomId = ref("")
	const roomIndex = ref(0)
	const textMessage = ref("")
	const roomToDelete = ref({})
	const messageToDelete = ref({})

	const orderedMessages = computed(() => {
		if(rooms.value[roomIndex.value]?.messages){
			let tempArray = JSON.parse(JSON.stringify(rooms.value[roomIndex.value].messages))
			return tempArray.reverse()
		}
		else return []
	})

	socket.on("connect", () => { getRooms() });
	socket.on("disconnect", () => { socket = io("ws://localhost:3000")});
	socket.on("get-rooms", (data) => { for(let room of data.rooms) joinRoom(room.id) })
	socket.on("join-room", (data) => { 
		let index = rooms.value.findIndex(room => { return room.id == data.room.id})
		if(index > -1) { 
			rooms.value[index] = data.room
			rooms.value[index].messages = data.messages
		}
		else{
			let obj = data.room
			obj.messages = data.messages;
			rooms.value.unshift(obj)
		} 
	}) 
	socket.on("delete-room", (data) => { rooms.value = rooms.value.filter(elem => elem.id != data.idRoom) }) 
	socket.on("new-message", (data) => {
		let indexRoom = rooms.value.findIndex(room => { return room.id == data.idRoom})
		if(indexRoom != -1){
			let index = rooms.value[indexRoom].messages.findIndex(m => { return m.id == data.message.id })
			if(index === -1) rooms.value[indexRoom].messages.push(data.message)
		}
	})
	socket.on("delete-message", (data) => {
		console.log(data)
		let indexRoom = rooms.value.findIndex(room => { return room.id == data.idRoom})
		if(indexRoom != -1){
			let index = rooms.value[indexRoom].messages.findIndex(m => { return m.id == data.idMessage })
			if(index !== -1) rooms.value[indexRoom].messages[index].message = "Ce message a été supprimé."
		}
	})

	const deconnexion = () => {
		logOut()
		router.push({ name: "auth" })
	}

	const getRooms = () => {
		socket.emit("get-rooms", { idUser: userId.value }); 
	}

	const createRoom = (data) => {
		socket.emit("create-room", { name: data.name, idUser: userId.value });
	}

	const joinRoom = (roomId) => {
		socket.emit("join-room", { idUser: userId.value, idRoom: roomId })
	}

	const joinRoomModal = (data) => {
		joinRoom(data.roomId)
	}

	const deleteRoom = () => {
		socket.emit("delete-room", { idUser: userId.value, idRoom: roomToDelete.value.id })
		roomIndex.value = 0
	}

	const copyClipboard = (text) => {
		navigator.clipboard.writeText(text);
	}

	const selectRoom = (id) => {
		roomId.value = id
	}

	const sendMessage = () => { 
		let idRoom = (roomId.value == "") ? rooms.value[roomIndex.value].id : roomId.value;
		if(textMessage.value != "") socket.emit("new-message", { idUser: userId.value, idRoom: idRoom, message: textMessage.value, username: username.value })
		textMessage.value = ""
	}

	const deleteMessage = () => {
		let idRoom = (roomId.value == "") ? rooms.value[roomIndex.value].id : roomId.value;
		socket.emit("delete-message", { idUser: userId.value, idRoom: idRoom, idMessage: messageToDelete.value.id })
	}

	const formatDate = (timestamp) => {
		let dtNow = DateTime.now();
		let dtToFormat = DateTime.fromMillis(timestamp);
		if(dtNow == dtToFormat) return dtToFormat.toFormat('dd/LL/y HH') + 'h' + dtToFormat.toFormat('mm')
		else return dtToFormat.toFormat('HH') + 'h' + dtToFormat.toFormat('mm')
		
	}

	watch(roomId, () => {
		let index = rooms.value.findIndex(room => { return room.id == roomId.value })
		roomIndex.value = index
		textMessage.value = ""
	})

	// Dealing with Textarea Height
	function calcHeight(value) {
		let numberOfLineBreaks = (value.match(/\n/g) || []).length;
		// min-height + lines x line-height + padding + border
		let newHeight = 20 + numberOfLineBreaks * 20 + 12 + 2;
		return newHeight;
	}

	onMounted(() => {
		new Tooltip(document.body, {
      selector: "[data-bs-toggle='tooltip']",
    })

		let textarea = document.querySelector(".resize-ta");
		textarea.addEventListener("keyup", () => {
			textarea.style.height = calcHeight(textarea.value) + "px";
		});

		addEventListener("keyup", function(event) {
			event.preventDefault();
			if(document.activeElement == document.getElementById("textarea"))
			if (event.key === "Enter") {
				if (!event.shiftKey) sendMessage()
			}
		})
	})

</script>

<template>

	<div class="container-fluid globalContainer">
		<div class="headerContainer">
			<div class="title">Chat'app</div>
			<button class="logoutButton" @click="deconnexion"> Deconnexion</button>
		</div>

		<div class="row rowContainer">
			<div class="col-md-3 roomsContainer">
				<div class="d-flex justify-content-evenly">
					<button class="roomButton" data-bs-toggle="modal" data-bs-target="#modalAddRoom">
						<i class="bi bi-plus-lg"></i>
						Créer un salon
					</button>
					<button class="roomButton" data-bs-toggle="modal" data-bs-target="#modalJoinRoom">
						<i class="bi bi-box-arrow-in-up"></i>
						Rejoindre un salon
					</button>
				</div>
				
				<hr style="margin: 0; opacity: 1;">

				<div v-for="(room, index) in rooms">
					<div class="roomContainer row" @click="selectRoom(room.id)" :class="(index == roomIndex) ? 'roomSelected' : ''">

						<div class="col-md-8">
							<div class="text-start roomTitle">{{ room.name }}</div>
							<p class="text-start roomMessage" v-if="room.messages.length">
								{{ formatDate(room.messages[room.messages.length - 1]?.date) }} : {{ room.messages[room.messages.length - 1]?.message}}
							</p>
							<p class="text-start roomMessage" v-else>Commencer à échanger !</p>
						</div>

						<div class="col-md-4 d-flex flex-column justify-content-evenly text-end">
							<div>
								<button class="copyButton text-dark" @click="copyClipboard(room.id)" data-bs-toggle="tooltip" :data-bs-title=room.id data-bs-placement="left">
										<i class="bi bi-clipboard-fill"></i>
									</button>
								</div>
							<div>
								<button class="deleteButton text-danger" @click="roomToDelete = room" data-bs-toggle="modal" data-bs-target="#modalSupprRoom">
									<i class="bi bi-trash-fill"></i>
								</button>
							</div>
						</div>

					</div>
				</div>

			</div>

			<div class="col-md-9 ps-0 pe-0 h-100">
				<div class="chatContainer">
					<div class="d-flex chatInputContainer">
						<div class="col-md-11">
							<textarea type="text" placeholder="Message" class="form-control textarea resize-ta" id="textarea" v-model="textMessage" rows="1"></textarea>
						</div>
						<div class="col-md-1 d-flex justify-content-center align-items-center ps-0 pe-1">
							<button @click="sendMessage()" class="sendButton" id="sendButton">
								<i class="bi bi-send-fill"></i>
							</button>
						</div>						
					</div>
					<div class="messagescontainer">
						<div v-for="m in orderedMessages">
							<div v-if="m.author == userId" class="d-flex align-items-baseline messageContainer myMessage ms-auto me-0">
								<pre>{{ formatDate(m.date ) }}</pre>
								<p @click="messageToDelete = m" data-bs-toggle="modal" data-bs-target="#modalSupprMessage">{{ m.message }}</p>
							</div>
							<div v-else class="d-flex flex-row-reverse align-items-baseline messageContainer text-start">
								<pre>{{ m.username + " à " + formatDate(m.date ) }}</pre>
								<p>{{ m.message }}</p>
							</div>
						</div>
					</div>
					
				</div>
			</div>
		</div>
	</div>


	<!-- Modal Create Room-->
	<div class="modal fade" id="modalAddRoom" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5">Nouveau salon</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">

					<FormKit
						type="form"
						id="registration"
						submit-label="creer"
						@submit="createRoom"
						:actions="false"
					>
						<FormKit
							type="text"
							name="name"
							label="Nom"
							placeholder="Nom du salon"
							help="Comment voulez-vous appeler votre salon ?"
							validation="required"
							wrapper-class="$reset"
						/>

						<div class="d-flex justify-content-end align-items-center">
							<FormKit type="submit" submit-label="creer" label="Créer" data-bs-dismiss="modal"/>
						</div>

					</FormKit>

				</div>
			</div>
		</div>
	</div>

	<!-- Modal Delete Room -->
	<div class="modal fade" id="modalSupprRoom" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5">Supprimer un salon ?</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body text-center fs-5">
					<p>Souhaitez-vous supprimer le salon "{{ roomToDelete.name }}" ?</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Non</button>
					<button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteRoom">Oui, supprimer</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Modal Join Room -->
	<div class="modal fade" id="modalJoinRoom" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5">Rejoindre un salon</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">

					<FormKit
						type="form"
						id="registration"
						submit-label="creer"
						@submit="joinRoomModal"
						:actions="false"
					>
						<FormKit
							type="text"
							name="roomId"
							label="ID du salon"
							placeholder="Identifiant du salon"
							help="Quelle est l'identifiant du salon à rejoindre ?"
							validation="required"
							wrapper-class="$reset"
						/>

						<div class="d-flex justify-content-end align-items-center">
							<FormKit type="submit" submit-label="creer" label="rejoindre" data-bs-dismiss="modal"/>
						</div>

					</FormKit>

				</div>
			</div>
		</div>
	</div>

	<!-- Modal Delete Room -->
	<div class="modal fade" id="modalSupprMessage" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5">Supprimer un message ?</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body text-center fs-5">
					<p>Souhaitez-vous supprimer le message "{{ messageToDelete.message }}" ?</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Non</button>
					<button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteMessage">Oui, supprimer</button>
				</div>
			</div>
		</div>
	</div>

</template>

<style>

	.globalContainer {
		padding: 0;
		height: 100vh;
		background-color: #fbfefb;
	}

	/*
		Classes CSS concernant la partie header de la page
	*/

	.headerContainer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 48px;
		border-bottom: 2px solid #adb5bd;
	}

	.logoutButton {
		border: none;
		color: white;
		height: 100%;
		background-color: #6a040f;
		font-weight: 350;
		font-size: 14pt;
		width: 150px;
	}

	.logoutButton:hover {
		border-bottom: solid 1px #6a040f;
		font-weight: 400;	
	}

	.title {
		width: 150px;
		text-align: center;
		color: black;
		font-size: 20pt;
		font-weight: 450;
	}

	/*
		Classe englobant la partie room et chat
	*/

	.rowContainer{
		height: calc(100% - 48px);
		margin: 0;
		padding: 0;
	}

	/*
		Classes concernant la partie room
	*/
	
	.roomsContainer {
		height: 100%;
		margin: 0;
		padding: 0;
		text-align: center;
		overflow: scroll;
	}

	.roomButton {
		width: 45%;
		height: 60px;
		margin: 10px auto 10px auto; 
		border: none;
		border-radius: 15px;
		color: white;
		background-color: #15616d;
		font-size: 12pt;
	}

	.roomButton:hover {
		background-color: #218380;
	}

	.roomContainer {
		border-bottom: 1px solid #adb5bd;
		height: 80px;
		margin: 0;
		padding: 8px 0;
		cursor: pointer;
	}

	.roomSelected {
		background-color: #e6e0da;
	}

	.roomContainer:hover {
		background-color: #e6e0da;
	}

	.roomTitle{
		font-size: 16pt;
		margin-left: 5px;
	}

	.roomMessage {
		font-size: 11pt;
		margin-left: 5px;
		margin-top:auto;
		margin-bottom: auto;

		text-overflow: ellipsis;
		overflow: hidden; 
		white-space: nowrap;
	}

	.roomTitle::first-letter {
		text-transform: uppercase;
	}

	.copyButton {
		border: 1px solid grey;
		background-color: white;
		border-radius: 10px;
		opacity: 0.5;
	}	

	.copyButton:active, .copyButton:hover {
		opacity: 1;
	}

	.deleteButton {
		border: 1px solid grey;
		background-color: white;
		border-radius: 10px;
		opacity: 0.5;
	}

	.deleteButton:active, .deleteButton:hover {
		opacity: 1;
	}

	/*
		Classe concernant la partie chat
	*/

	.chatContainer{
		display: flex;
		flex-direction: column-reverse;
		height: 100%;
		border-left: 2px solid #adb5bd;
	}

	.messagescontainer {
		display: flex;
		flex-direction: column-reverse;
		overflow-y: scroll;
	}

	.messageContainer{
		width: fit-content;
	}

	.messagescontainer > div:hover {
		background-color: #e6e0da;
	}

	.messageContainer > p {
		border: 1px solid #adb5bd;
		border-radius: 10px;
		margin: 8px 10px;
		margin-top: 10px;
		padding: 5px 10px;
		font-size: 14pt;
		white-space: pre-line;
		background-color: black;
		color: white;
	}

	.myMessage > p {
		background-color: #0077b6;
	}

	.myMessage > p:hover {
		cursor: pointer;
		background-color: #6a040f;
	}

	.chatInputContainer{
		background-color: white;
		border-top: 1px solid grey;
		width: 100%;
	}

	.textarea {
		width: 99%;
		overflow-y: scroll;
		resize: vertical;
		margin: 10px auto;
		padding: 5px auto;
		border-color: black;
	}

	.sendButton {
		border: none;
		border-radius: 10px;
		width: 100%;
		min-height: 36px;
		background-color: #168aad;
		color: white;
	}

	.sendButton:hover {
		border: 2px solid #168aad;
		background-color: white;
		color: #168aad;
	}

	/*
		Classe concernant la scrollbar
	*/

	::-webkit-scrollbar {
    width: 6px;
	}
		
	/* Track */
	::-webkit-scrollbar-track {
		background: white;
		border-radius: 15px;
		margin: 2px auto;
	}
		
	/* Handle */
	::-webkit-scrollbar-thumb {
			background: #555; 
			/* margin: 2px;
			border: 1px solid black; */
			border-radius: 10px;
	}
		
	/* Handle on hover */
	::-webkit-scrollbar-thumb:hover {
			background: #888; 
	}

</style>
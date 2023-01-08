<script setup>
	import { ref, watch } from 'vue'
	import { useRouter } from "vue-router"
	import { useUser } from "../stores/user"
	import axios from "axios"
	import Cookies from 'js-cookie'

	// Router
	const router = useRouter()

	// Signin or register
	const mode = ref("signin")

	const { setUserName, setUserId } = useUser()

	setTimeout(() => {
		if(mode.value == 'register') mode.value == 'signin'
	}, 1000)

	// error returned by the backend (to be printed on the form)
	const error = ref("")

	// handle of the signup/signing event
	const submitted = ref(false)
	const submitHandler = async (credentials) => {
		// const endpoint = (mode == 'signup') ? "/auth/login" : "/auth/register";  // for PRODUCTION
		const endpoint = (mode.value == 'signin') ? "/login" : "/register"			// for DEV
		try {
			const response = await axios.post("http://localhost:3001" + endpoint, credentials, { withCredentials: true })
			submitted.value = true;
			setUserName(response.data.username)
			setUserId(response.data.userId)

			if(Cookies.get("session_id")) router.push({ name: "chat" })
			
		} catch (e) {
			error.value = e.response.data.error;
			submitted.value = false;
		}
	}

	watch(mode, (n,o) => {
		error.value = ''
	})

</script>

<template>
	<div class="container-fluid p-0 m-0 containerBg">
		<div class="row justify-content-center m-0 p-0">
			<div class="col-md-4 auth-container p-5">
				<div class="mb-3 d-flex justify-content-between">
					<div>
						<h1 class="text-center">Chat'app</h1>
					</div>
					<div class="input-group d-flex justify-content-end">
						<button 
							class="btn btn-lg" 
							:class="(mode == 'signin') ? 'btn-primary' : 'btn-outline-secondary'" 
							@click="mode = 'signin'" 
							type="button">
							Signin
						</button>
						<button 
							class="btn btn-lg" 
							:class="(mode == 'register') ? 'btn-primary' : 'btn-outline-secondary'" 
							@click="mode = 'register'"
							type="button">
							Register
						</button>
					</div>
					
				</div>

				<pre v-if="error" style="color: red">{{ error }}</pre>
				<FormKit
					type="form"
					id="registration"
					:form-class="submitted ? 'hide' : 'show'"
					:submit-label="mode"
					@submit="submitHandler"
					:actions="false"
				>
					<FormKit
						v-if="mode == 'register'"
						type="text"
						name="username"
						label="Your username"
						placeholder="Jane Doe"
						help="What do people call you?"
						validation="required"
						wrapper-class="$reset"
					/>
					<FormKit
						type="text"
						name="email"
						label="Your email"
						placeholder="jane@example.com"
						help="What email should we use?"
						validation="required|email"
						wrapper-class="$reset"
					/>
					<FormKit
						type="password"
						name="password"
						label="Password"
						validation="required|length:5|matches:/[^a-zA-Z]/"
						:validation-messages="{
							matches: 'Please include at least one symbol',
						}"
						placeholder="Your password"
						help="Choose a password"
						wrapper-class="$reset"
					/>

					<div class="d-flex justify-content-between align-items-center">
						<FormKit
							type="submit"
							:submit-label="(mode == 'signin') ? 'Signin' : 'Register'"
							:label="(mode == 'signin') ? 'Signin' : 'Register'"
						/>

						<div v-if="submitted">
							<h3 class="text-success">Submission successful!</h3>
						</div>
					</div>
				</FormKit>
				

			</div>
		</div>
	</div>
</template>

<style>
	.containerBg{
		height: 100vh;
		background-image: linear-gradient(to bottom left, #e74c3c, #8e44ad);
	}

	.auth-container{
		border: solid 2px #535c68;
		border-radius: 15px;
		background-color: white;
		margin-top: 25vh;
		/* box-shadow: 0 0 .5em 0 #000; */
	}
</style>
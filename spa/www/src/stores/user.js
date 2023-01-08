import { ref, computed } from "vue";
import Cookies from 'js-cookie'

const username = ref(localStorage.getItem("username") || "")
const userId = ref(localStorage.getItem("userId") || "")

export const useUser = () => {
  const isLoggedIn = computed(() => username.value !== "")

  function setUserName(n) {
    username.value = n
    localStorage.setItem("username", n);
  }

  function setUserId(n) {
    userId.value = n
    localStorage.setItem("userId", n);
  }

  function logOut() {
    username.value = ""
    userId.value = ""
    localStorage.removeItem("username")
    localStorage.removeItem("userId")
    Cookies.remove('session_id')
  }

  return { username: username, userId: userId, isLoggedIn, setUserName, setUserId, logOut }
};

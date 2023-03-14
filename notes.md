# npm i socket.io-client

import io from "socket.io-client"

useEffect(() => {
const socket = io("http://192.168.1.102:3000")
} ,[])

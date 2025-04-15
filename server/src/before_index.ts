const express = require("express");
const app = express();
const PORT = 1234;

type todo = {
  id: number;
  title: string;
  status: "TODO" | "ONGOING" | "COMPLETED";
  content: string;
  date: Date;
};

type userData = {
  userID: number;
  userName: string;
  password: string;
  admin: boolean;
  defaultTimer: number;
  todos: todo[];
};

type usernameAndPassword = {
  userID: number;
  userName: string;
  password: string;
};

type FindUserFunction = (UserID: number) => userData;

const sampleTodo: todo = {
  id: 101,
  title: "PROJECT",
  status: "TODO",
  content: "FInish the project didioots",
  date: new Date("2025-04-17T10:00:00.000z"),
};
const sampleTodo2: todo = {
  id: 101,
  title: "GYM",
  status: "TODO",
  content: "leg day",
  date: new Date("2025-04-16T10:00:00.000z"),
};

let data: userData[] = [
  {
    userID: 101,
    userName: "antony",
    password: "",
    admin: true,
    defaultTimer: 25,
    todos: [sampleTodo, sampleTodo2],
  },
  {
    userID: 102,
    userName: "Abilash",
    password: "",
    admin: false,
    defaultTimer: 36,
    todos: [sampleTodo],
  },
  {
    userID: 103,
    userName: "Daniel",
    password: "",
    admin: false,
    defaultTimer: 14,
    todos: [sampleTodo],
  },
];

const availableUsernames: string[] = ["Antony", "Abliash", "Daniel"];

const userPassword: usernameAndPassword[] = [
  {
    userID: 101,
    userName: "Antony",
    password: "",
  },
  {
    userID: 102,
    userName: "Abilash",
    password: "",
  },
  {
    userID: 103,
    userName: "Daniel",
    password: "",
  },
];

const FindUser: FindUserFunction = (userID) => {
  data.map((user) => {
    if (user.userID === userID) {
      return user;
    }
  });
  return data[1];
};

app.get("/", (req: any, res: any) => {
  res.send(data);
});

app.get("/user", (req: any, res: any) => {
  res.send(data);
});

app.get("/user/login", (req: any, res: any) => {
  const attemptUsername = req.body.username;
  if (!attemptUsername) {
    res.sendStatus(404);
  }
  const attemptPassword = req.body.password;
  if (attemptUsername in availableUsernames) {
    userPassword.map((user) => {
      if (
        user.userName === attemptUsername &&
        user.password === attemptPassword
      ) {
        console.log(user);
        res.sendJSON(FindUser(user.userID));
      }
    });
    return;
  }
  return;
});

app.get("/user/:id/", (req: any, res: any) => {
  console.log(req);
  const userID: number = req.params.id;
  res.send(data[userID - 101]);
});

// app.post("/user/:id/" , (req: any, res: any) => {
//   const user = FindUser(req.params.id)
//   use
// });

// app.post(user/id)
// check if the input is valid,
// append the user id to the list of
// add the todo to the list of

//edit method

//modify the database on edit
//add todos assigned by the manager
//send notifs to the person when manager assigns todos
//send notifs to the manager when todos are completed

//management structure?
//todo sub categories?

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

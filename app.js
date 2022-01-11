import * as path from "path";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import passport from "passport";
import { engine } from "express-handlebars";
import methodOverride from "method-override";
import connectDB from "./config/db.js";
import main from "./routes/index.js";
import auth from "./routes/auth.js";
import stories from "./routes/stories.js";
import passports from "./config/passport.js";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";

// Load config
dotenv.config({ path: "./config/config.env" });

// passport config
passports(passport);

connectDB();

const MongoStore = MongoDBStore(session);
const store = new MongoStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
});

 
const app = express();

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// method override
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Handlebars Helpers
import {
  formatDate,
  truncate,
  stripTags,
  editIcon,
  select,
} from "./helpers/hbs.js";

// express-handlebar
app.engine(
  ".hbs",
  engine({
    helpers: { formatDate, truncate, stripTags, editIcon, select },
    defaultLayout: "main",
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");

// sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//  passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

//Routes
app.use("/", main);
app.use("/auth", auth);
app.use("/stories", stories);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

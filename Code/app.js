const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyparser = require('body-parser');
const connection = require("./connection/db_config");
const { Server } = require("https");
const { send } = require("process");
const router = express.Router();
const mysql = require("mysql");

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());


// sending the user the home page when he joins or login
app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/home.html");
});


// sending the user the /home page
app.get("/home",(req,res)=>{
    res.sendFile(__dirname + "/home.html");
});


// sending the page to register the new employee and student to the database

// sending page for employee first
app.get("/register-emp",(req,res)=>{
    res.sendFile(__dirname + "/registerEmp.html");
});

// sending for student
app.get("/register-student",(req,res)=>{
    res.sendFile(__dirname + "/registerStudent.html");
});


// getting the data of the new employee , student and books and storing in database

app.post("/register-emp",(req,res)=>{
    const email = req.body.employ_email;
    const password = req.body.employ_password;
    const name = req.body.employ_name;
    const position = req.body.position;
    const salary = req.body.salary;

    connection.query('SELECT * FROM employee WHERE employ_email = ?',[email],(err,result)=>{
        if(err) {
            console.error(err);
            return res.status(500).send({error: 'Server Error'});
        }

        if(result.length > 0) {
            res.status(400).render("registerEmp",{errorMessage: 'Employee Already registered'});
        }
        else {
            connection.query('INSERT INTO employee(employ_email,employ_password,employ_name,position,salary) VALUES(?,?,?,?,?)',[email,password,name,position,salary],(err,results,fields)=>{
                if(err) throw err;
                console.log("Data inserted into database");
                // res.sendFile(__dirname + '/home.html');
                return res.render('registerEmp',{errorMessage: "Employee Registered"});
            });
        }
    });
});

app.post("/register-student",(req,res)=>{
    const name = req.body.student_name;
    const email = req.body.student_email;
    const address = req.body.student_address;
    const phoneNumber = req.body.student_phoneNo;
    const branch = req.body.student_branch;
    const today = new Date();

    connection.query('SELECT * FROM student WHERE student_email = ?',[email],(err,results)=>{
        if(err) {
            console.log(err);
            return res.status(500).send({erroe:"Server Error"});
        }
        if(results.length > 0) {
            res.status(400).render("registerStudent",{errorMessage:'Student already Registered'});
        }
        else {
            connection.query('INSERT INTO student(student_name,student_email,student_phoneNo,student_address,registration_date,student_branch) VALUES(?,?,?,?,?,?)',[name,email,phoneNumber,address,today,branch],(err,results,fields)=>{
                if(err) {
                    console.log(err);
                    return res.status(500),send({error:'Server Error'});
                }
                else {
                    console.log("Student registered successfully");
                    return res.render("registerStudent",{errorMessage: "Student Registered Successfully"});
                }
            });
        }
    });
});


// adding the new books into database
app.get("/addbook",(req,res)=>{
    res.sendFile(__dirname + "/addBook.html");
});


app.post("/addBook",(req,res)=>{
    const name = req.body.book_title;
    const author = req.body.author;
    const ISBN = req.body.ISBN;
    const category = req.body.category;
    const status = req.body.status;

    connection.query('SELECT * FROM books WHERE book_title = ? AND author = ?',[name,author],(err,results)=>{
        if(err){
            console.log(err);
            return res.status(500).send({error: "Server Error"});
        }
        if(results.length > 0) {
            res.status(400).render("addBook",{errorMessage: "Book Already registered"});
        }
        else {
            connection.query('INSERT INTO books(ISBN,book_title,category,status,author) VALUES(?,?,?,?,?)',[ISBN,name,category,status,author],(err,results,fields)=>{
                if(err) {
                    console.log(err);
                    return res.status(500).send({error: "Server Error"});
                }
                else {
                    console.log("Book added into database successfully");
                    return res.render("addBook",{errorMessage: "Book added Successfully"});
                }
            });
        }
    });
});


// issuing the book
app.get('/issue-book/:ISBN',(req,res)=>{
    var bookISBN = req.params.ISBN;

    connection.query('SELECT * FROM books WHERE ISBN = ?',[bookISBN],(err,results)=>{
        if(err) {
            throw err;
        }
        if(results.length > 0 && results[0].status === "Unavailable") {
                const query = req.query.search;
    
                let sql = 'SELECT * FROM books';
    
                if (query) {
                    sql = `SELECT * FROM books WHERE book_title LIKE '%${query}%' OR category LIKE '%${query}%' OR ISBN LIKE '%${query}%' OR status LIKE '%${query}%' OR author LIKE '%${query}%'`;
                }
                connection.query(sql,(err,result)=>{
                    if(err) throw err;
                    res.render('searchbook',{books: result});
                });
        }
        else {
            res.render('issuedbook',{books : results});
        }
    });
});

app.post('/issue-book',(req,res)=>{
    const studentID = req.body.issued_student;
    const date = new Date();
    const bookName = req.body.issued_book_name;
    const ISBN = req.body.isbn_book;

    connection.query('SELECT * FROM issue_status WHERE issued_book_name = ? OR isbn_book = ?',[bookName,ISBN],(err,results)=>{
        if(err) {
            console.log(err);
            return res.status(500).send({error:"Server Error"});
        }
        // if(results.length > 0) {
        //     res.status(400).render("home",{errorMessage:'Book is Unavailabe'});
        // }
        else {
            connection.query('UPDATE books SET status = ? WHERE ISBN = ?',["Unavailable",ISBN],(err,results)=>{
                if(err) {
                    console.log(err);
                    return res.status(500).send({error:"Server Error"});
                }
            });
            connection.query('INSERT INTO issued_status(issued_student,issued_book_name,issue_date,isbn_book) VALUES(?,?,?,?)',[studentID,bookName,date,ISBN],(err,result,fields)=>{
                if(err) {
                    console.log(err);
                    return res.status(500),send({error:'Server Error'});
                }
            });
            connection.query('INSERT INTO issue_status(issued_student,issued_book_name,issue_date,isbn_book) VALUES(?,?,?,?)',[studentID,bookName,date,ISBN],(err,result,fields)=>{
                if(err) {
                    console.log(err);
                    return res.status(500),send({error:'Server Error'});
                }
                else {
                    console.log("Book Issued Successfully");
                    return res.render("home",{errorMessage:'Book Issued Succeffuly'});
                }
            });
        }
    });
});

// Returing the books

app.get('/return-book/:ISBN',(req,res)=>{
    var bookISBN = req.params.ISBN;

    connection.query('SELECT * FROM issue_status WHERE isbn_book = ?',[bookISBN],(err,results)=>{
        if(err) {
            throw err;
        }
        if(results.length <= 0) {
            const query = req.query.search;

            let sql = 'SELECT * FROM books';

            if (query) {
                sql = `SELECT * FROM books WHERE book_title LIKE '%${query}%' OR category LIKE '%${query}%' OR ISBN LIKE '%${query}%' OR status LIKE '%${query}%' OR author LIKE '%${query}%'`;
            }
            connection.query(sql,(err,result)=>{
                if(err) throw err;
                res.render('searchbook',{books: result});
            });
        }
        else {
            connection.query('DELETE FROM issue_status WHERE isbn_book = ?', [bookISBN], (err, deleteResult) => {
                if(err) {
                    throw err;
                }
                res.render('returnbook',{books: results});
            });
        }
    });
});

app.post('/return-book',(req,res)=>{
    const studentID = req.body.return_student;
    const bookName = req.body.returned_book_name;
    const date = new Date();
    const ISBN = req.body.isbn_book2;
    const issued_id = req.body.issued_id;

    connection.query('SELECT * FROM return_status WHERE issued_id = ?',[issued_id],(err,results)=>{
        if(err) {
            console.log(err);
            return res.status(500).send({error:"Server Error"});
        }
        if(results.length > 0) {
            res.status(400).render("home",{errorMessage:'Book is availabe'});
        }
        else {
            connection.query('UPDATE books SET status = ? WHERE ISBN = ?',["available",ISBN],(err,results)=>{
                if(err) {
                    console.log(err);
                    return res.status(500).send({error:"Server Error"});
                }
            });
            connection.query('INSERT INTO return_status(return_student,returned_book_name,return_date,isbn_book2,issued_id) VALUES(?,?,?,?,?)',[studentID,bookName,date,ISBN,issued_id],(err,result,fields)=>{
                if(err) {
                    console.log(err);
                    return res.status(500),send({error:'Server Error'});
                }
                else {
                    console.log("Book Returned Successfully");
                    return res.render("home",{errorMessage:'Book Returned Succeffuly'});
                }
            });
        }
    });
});

// updating book information
app.get('/update-book/:ISBN',(req,res)=>{
    const bookISBN = req.params.ISBN;

    connection.query('SELECT * FROM books WHERE ISBN = ?',[bookISBN],(err,results)=>{
        if(err){
            throw err;
        }
        res.render('updateBook',{books : results});
    });
});

app.post('/updateBook',(req,res)=>{
    const ISBN = req.body.ISBN;
    const book_title = req.body.book_title;
    const author = req.body.author;
    const category = req.body.category;
   

    connection.query('SELECT * FROM books WHERE ISBN =?',[ISBN],(err,results)=>{
        if(err){
            throw err;
        }
        else {
            connection.query('UPDATE books SET ISBN =?, book_title = ?, author = ?, category = ? WHERE ISBN = ?',[ISBN,book_title,author,category,ISBN],(err,results)=>{
                if(err)
                {
                    throw err;
                }
                else {
                    console.log("Book updated Successfully");
                    res.render('home',{errorMessage: "Book Updated Successfully"});
                }
            });
        }
    });
});

// app.post("/register-student",(req,res)=>{
//     const 
// })

// setting up the search system page for the user 

// user can search for books here


app.get("/search",(req,res)=>{
    const query = req.query.search;

    let sql = 'SELECT * FROM books';

    if (query) {
        sql = `SELECT * FROM books WHERE book_title LIKE '%${query}%' OR category LIKE '%${query}%' OR ISBN LIKE '%${query}%' OR status LIKE '%${query}%' OR author LIKE '%${query}%'`;
    }


    connection.query(sql,(err,result)=>{
        if(err) throw err;
        res.render('searchbook',{books: result});
    });
});


// Making the join operation 
app.get('/studentinfo', (req, res) => {
    connection.query('SELECT * FROM student INNER JOIN issued_status ON student.student_id = issued_status.issued_student INNER JOIN return_status ON issued_status.isbn_book = return_status.isbn_book2 OR issued_status.issued_student = return_status.return_student;', (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send('An error occurred while fetching student information');
      }
      res.render('bookstaken', { details: result });
    });
  });

// checking connection with the database
connection.connect((err)=>{
    if(err) throw err;
    else{
        console.log("Database COnnected Successfully")
    }
});

// set the server port
app.listen(3000,()=>{
    console.log("Server is running at port http://localhost:3000");
});
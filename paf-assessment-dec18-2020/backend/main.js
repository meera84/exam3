require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
var sha1 = require('sha1');
const mysql = require('mysql2/promise')
const cors = require('cors')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const { MongoClient  } = require('mongodb')
const fs = require('fs')

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const pool = mysql.createPool ({
	  host : process.env.MYSQL_SERVER,
	  port: process.env.SVR_PORT,
	  user: process.env.MYSQL_USERNAME,
	  password: process.env.MYSQL_PASSWORD,
	  database: process.env.MYSQL_SCHEMA,
	  connectionLimit:process.env.MYSQL_CON_LIMIT
	})

	//configuring S3
	const AWS_S3_HOSTNAME = process.env.AWS_S3_HOSTNAME
	const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY
	const AWS_S3_SECRET_ACCESSKEY = process.env.AWS_S3_SECRET_ACCESSKEY
	const AWS_S3_BUCKETNAME = process.env.AWS_S3_BUCKETNAME
	
	const spaceEndPoint = new AWS.Endpoint(AWS_S3_HOSTNAME)
  const s3= new AWS.S3({
  endpoint: spaceEndPoint,
  accessKeyId: AWS_S3_ACCESS_KEY,
  secretAccessKey:AWS_S3_SECRET_ACCESSKEY,
})

const MONGO_URL = 'mongodb://localhost:27017'
const MONGO_DATABASE = 'photo'
const MONGO_COLLECTION = 'reviews'
const mongoClient = new MongoClient(MONGO_URL, 
  { useNewUrlParser: true, useUnifiedTopology: true })

const upload = multer({
	dest: process.env.TMP_DIR || './temporaryfolder'
})
const app = express()

app.use(morgan('combined'))
// app.use(cors())
app.use(bodyParser.urlencoded({limit:'50mb', extended:true}))
app.use(bodyParser.json({limit:'50mb'}))

//chuks codes
const mkPhoto = (params, image) => {
	return {
		timestamp: new Date(),
		// username: params.username,
		// password: params.password,
		title: params.title,
		comments:params.comments,
		image: image,
		imageurl:`https://meera1.nyc3.digitaloceanspaces.com/${image}`
	}
}

const readFile = (path) => new Promise(
	(resolve, reject) => 
		fs.readFile(path, (err, buff) => {
			if (null != err)
				reject(err)
			else 
				resolve(buff)
		})
)

const putObject = (file, buff, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: 'meera1',
			Key: file.filename, 
			Body: buff,
			ACL: 'public-read',
			ContentType: file.mimetype,
			ContentLength: file.size
		}
		s3.putObject(params, (err, result) => {
			if (null != err)
				reject(err)
			else
				resolve(result)
		})
		
	}
)






//constructing the url queries. One is of Get. Another one is of Insert. 
const querytest="select * from user where user_id=?"

//this is the new part

app.post('/api/image', upload.single('image1'), (req, resp) => {
			
		console.info('>>> req.body: ', req.body)
		console.info('>>> req.file: ', req.file)
		
		const doc = mkPhoto(req.body, req.file.filename)
		if ((req.body.username == null) || (req.body.password ==null)){
				resp.status(401)
				resp.json({ error })
		}

		readFile(req.file.path)
			.then(buff => 
				{putObject(req.file, buff, s3);
				}
			)
			.then(result => 
				mongoClient.db(MONGO_DATABASE).collection(MONGO_COLLECTION)
					.insertOne(doc)
			)
			.then(results => {
				console.info('insert results: ', results)
				fs.unlink(req.file.path, () => { })
				resp.status(200)
				resp.json({ id: results.ops[0]._id })
				
			})
			.catch(error => {
				console.error('insert error: ', error)
				resp.status(500)
				resp.json({ error })
			})
		})
	






//closure function - using the same function to make query.
const makeQuery=(sql,pool)=> {
  console.log(sql)
  return (async (args)=>{
    const conn = await pool.getConnection();
    try {
      let results = await conn.query(sql,args||[]);
      return results[0];
    }catch (err){
      console.log(err)
    }
    finally{
      conn.release()
    }
  })
}

	//start the server for both mongo and sql
const promise1 = mongoClient.connect();
const promise2 = pool.getConnection()
    .then( (conn) => {
        try {
            conn.ping();
        } finally {
            conn.release()
        }
    });
Promise.all([promise1, promise2])
    .then(() => {
	//took from original code and put it here. 
        app.listen(PORT, () => {
            console.info(`Application started on PORT: ${PORT} at ${new Date()}`);
        })
    })
    .catch(e => {
        console.error(`Cannot connect to database: `,e)
    });



//assigning the closure function to a variable.
const checkuser = makeQuery(querytest,pool)


	app.post('/api/user',(req,res)=> {
				const bodyValue = req.body
				console.log('username',bodyValue.username)
				console.log('password',bodyValue.password)
				hashpassword = sha1(bodyValue.password)
				console.log('hassword',hashpassword)
				checkuser([bodyValue.username]) //<<<passing the inner arguments. 
  		  .then(results=> {
						console.log("resultuser",results[0]['user_id'])
						console.log("resultspassword", results[0]['password'])
						if (results[0]['password'] == hashpassword)
						{res.status(200).json(results)}
					else
						{res.status(401);
						 res.json({ message: `invalid username or password`})
						}	

    })
});
app.use(express.static(__dirname+'/frontend'))
    
	    
//adding the comments and the title to MongoDb. Temporary place. till image. 

// app.post('/api/mongo',async (req,res)=> {
// 	const bodyValue = req.body
// 	console.log('title',bodyValue.title)
// 	console.log('comments1',bodyValue.comments)
// 	let timestamp = new Date()
// 	const result = await mongoClient.db(MONGO_DATABASE).collection(MONGO_COLLECTION)
//        .insertOne ({
// 					title:bodyValue.title,
// 					comments:bodyValue.comments,
// 					timestamp:timestamp
// 				})
//   console.log('mongoresults',result)
// 	res.status(200)
// 	res.json({})
// });
//     


// //start the app
// startApp(app,pool)
//   const startApp = (async (app,pool)=> {
// 	    const conn = await pool.getConnection();
// 	    try {
// 	      console.log('test database connection....')
// 	      await conn.ping();
// 				//took from original code and put it here. 
// 	      app.listen(PORT, () => {
// 				console.info(`Application started on port ${PORT} at ${new Date()}`)
// 	})
// 	      
// 	    }catch(e){console.error('Cannot ping database', e);
// 	    }finally{
// 	      conn.release()
// 	    }
// 	  })

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: AWS_S3_BUCKETNAME,
//     acl: 'public-read',
//     metadata: function (req, file, cb) {
//       cb(null, {
//           fieldName: file.fieldname,
//           originalFileName: file.originalname,
//           uploadTimeStamp: new Date().toString(),
        
//       });
//     },
//     key: function (request, file, cb) {
//       console.log(file);
//       cb(null, new Date().getTime()+'_'+ file.originalname);
//     }
//   })
// }).single('upload');

// app.post('/api/image', (request, response, next)=> {
	
//   upload(request, response, (error)=> {
// 		console.log('reach app.postapiimage')
//       if (error) {
//         console.log(error);
//         response.status(500).json({error: error.message});
//       }
//       console.log('File uploaded successfully.');
//       response.status(200).json({
//         message: "uploaded",
//         s3_file_key: response.req.file.location
//       });
//   });

// }, async(request,response)=>{
// 	console.log("req",request.body)
// 	console.log("req",request.file)

// }
// );

 




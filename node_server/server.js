const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3015;

// Initialize Firebase app with downloaded credentials
// path to serviceAccount.json
// path_serviceAccount = 'D:\\teme_project\\node_server\\whatsappmy-40c21-firebase-adminsdk-wsbe4-b8384ecc15'
admin.initializeApp({
  credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
  databaseURL: 'https://whatsappmy-40c21-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();
app.use(cors());
app.use(bodyParser.json());

// CRUD operations for Nonprofits
app.post('/nonprofits', async (req, res) => {
  console.log('in nonprofits');
  try {
    console.log('in try block nonprofits');
    const data = req.body;
    const docRef = await db.collection('nonprofits').add(data);
    res.json({ message: `Nonprofit created with ID: ${docRef.id}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating nonprofit' });
  }
});

app.get('/nonprofits', async (req, res) => {
  console.log(' nonprofits from get method');
  try {
    console.log('in nonprofits---');
    const nonprofits = [];
    const snapshot = await db.collection('nonprofits').get();
    snapshot.forEach((doc) => nonprofits.push({ id: doc.id, ...doc.data() }));
    res.json(nonprofits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching nonprofits' });
  }
});

async function getNonprofitData(recipientId) {
  const nonprofitRef = db.collection('nonprofits').doc(recipientId);
  const snapshot = await nonprofitRef.get();

  if (snapshot.exists) {
    return snapshot.data();
  } else {
    console.error(`Recipient with ID ${recipientId} not found in Firestore`);
    return undefined; // Or handle missing data explicitly (optional)
  }
}

// Send Email functionality (using a placeholder for actual sending)
app.post('/emails', async (req, res) => {
  const { recipients, message } = req.body;
  console.log('recipients =', recipients);
  try {
    const sentEmails = [];
    // Ensure selectedNonprofits is an array
    for (const recipient of req.body.recipients) {
      console.log('enter in fro loop');
      const recipientId = recipient;
      // Pass recipientId correctly
      nonprofitData = await getNonprofitData(recipientId);
      if (!recipientId) continue;

      const emailContent = message
        .replace('{name}', nonprofitData.name)
        .replace('{address}', nonprofitData.address);

      // Prepare data for the sent email
      const sentEmail = {
        recipients: recipientId, // Use recipientId for a single recipient
        message,
        email: nonprofitData.email,
        sent_at: admin.firestore.Timestamp.now(),
      };
      // console.log('sentEmail -->', sentEmail);
      // Save sent email information to Firestore (assuming a collection named "sentEmails")
      const sentEmailRef = await db.collection("sentEmails").add(sentEmail);
      // Add the sent email details to the response (optional)
      sentEmails.push({ ...sentEmail, id: sentEmailRef.id });
    }
    res.json({ message: 'Message sent to the email successfully', sentEmails }); // Include sent emails data (optional)
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
})

// Get sent emails
app.get('/sentEmails', async (req, res) => {
  console.log('sentEmails from get method');
  try {
    const sentEmails = [];
    const snapshot = await db.collection('sentEmails').get(); // Replace with your collection name
    console.log('snapshot in get method sentEmails =', snapshot);
    snapshot.forEach((doc) => {
      const emailData = doc.data(); // Extract data from the document
      console.log('emailData in get method sentEmails =', emailData);
      sentEmails.push({ id: doc.id, ...emailData, sent_at: emailData.sent_at.toDate().toString() }); // Convert sent_at to string
    });
    console.log('sentEmils in get method sentEmails =', sentEmails);
    res.json(sentEmails);  // Send the response with formatted data
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ message: 'Error fetching emails' }); // Handle errors appropriately
  }
});

app.listen(port, () => {

  console.log(`Server is running on http://localhost:${port}`);
});
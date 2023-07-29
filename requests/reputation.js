const { Router } = require('express');
const cheerio = require('cheerio');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const SentimentAnalyzer = natural.SentimentAnalyzer;
// const SentenceAnalyzer = natural.SentenceAnalyzer;

const stemmer = natural.PorterStemmer;
const analyzer = new SentimentAnalyzer('English', stemmer, 'afinn');
// const senanalyzer = new SentenceAnalyzer('English');


const router = Router();
const User = require('../Schema/UserSchema')
const Question = require('../Schema/QuestionSchema');
const Answer = require('../Schema/AnswerSchema');
const Petition = require('../Schema/PetitionSchema')
const Academic = require('../Schema/AcademicHelpSchema')

router.put('/request/user/:userId/reputation', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Retrieve the user from the database
        const user = await User.findById(userId);

        // Calculate the user's reputation based on various factors
        let reputation = 0;

        // Calculate reputation based on upvotes and downvotes received on answers
        const Answers = await User.findById(userId).populate('AnswersGiven', 'upvotes downvotes');
        if (Answers && Answers.length > 0) {
            Answers.forEach((ans) => {
                const Ansupvotes = ans.upvotes.length
                const Ansdownvotes = ans.downvotes.length;
                reputation += (Ansupvotes - Ansdownvotes);
            })
        }
        const Questions = await User.findById(userId).populate('Questionsasked', 'upvotes downvotes');
        if (Questions && Questions.length > 0) {
            Questions.forEach((Qus) => {
                const Qusupvotes = Qus.upvotes.length;
                const Qusdownvotes = Qus.downvotes.length;

                reputation += (Qusupvotes - Qusdownvotes);
            })
        }

        // Calculate reputation based on questions asked
        reputation += user.Questionsasked.length * 1; // Assuming each question contributes 2 reputation points

        // Calculate reputation based on overall user activity
        const totalActivity =
            user.Questionsasked.length +
            user.AnswersGiven.length +
            user.PetitionsAsked.length +
            user.Commentsposted.length +
            user.PostsUploaded.length;

        reputation += totalActivity * 0.5; // Assuming each activity contributes 0.5 reputation points

        // Update the user's reputation field
        user.reputation = reputation;

        // Save the updated user object to the database
        await user.save();

        res.status(200).json({ success: true, message: 'User reputation updated successfully.' });
    } catch (error) {
        console.error('Error updating user reputation:', error);
        res.status(500).json({ success: false, message: 'Failed to update user reputation.' });
    }
})

router.put('/request/question/:quesId/reputation', async (req, res) => {
    const quesId = req.params.quesId;

    try {
        const Ques = await Question.findById(quesId).populate('userId', 'reputation');

        let relevanceScore = 0;
        if (Ques) {
            relevanceScore += (Ques.upvotes.length - Ques.downvotes.length) * 0.2;
            relevanceScore += Ques.answers.length * 0.4;
            relevanceScore += Ques.hashtags.length * 0.1;
            relevanceScore += Ques.userId.reputation * 0.3;
            const today = new Date();
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(today.getDate() - 10);
            const timeWeight = Ques.createdAt >= tenDaysAgo ? 1.7 : 1;

            relevanceScore += timeWeight * relevanceScore;

            Ques.relevanceScore = relevanceScore;

            await Ques.save();
            res.status(200).json({ success: true, message: 'Question reputation updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Question Not found' });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "internal error" });
    }
})

const extractKeywords = (text) => {

    const words = tokenizer.tokenize(text);

    // Filter out common stop words (e.g., "the", "is", "and", etc.)
    const stopWords = natural.stopwords;
    const filteredWords = words.filter((word) => !stopWords.includes(word.toLowerCase()));

    // Perform additional processing or filtering as per your requirements
    // ...

    return filteredWords;
}

const SentimentAnalysis = (answerText) => {
    // console.log("analysis -->", answerText);
    const tokenizedText = tokenizer.tokenize(answerText);

    const sentimentThreshold = 0.2;
    const sentiment = analyzer.getSentiment(tokenizedText);

    // console.log(sentiment);
    // Interpret the sentiment score
    let relevanceWeight = 0;
    if (sentiment > sentimentThreshold) {
        relevanceWeight = 0.4; //positive
    } else if (sentiment < -sentimentThreshold) {
        relevanceWeight = 0.1; //negative
    } else {
        relevanceWeight = 0.2; //neutral
    }

    return relevanceWeight;
}

const htmlToText = (html) => {
    const $ = cheerio.load(html);
    return $.text();
}

router.put('/request/answer/:ansid/reputation', async (req, res) => {
    const ansid = req.params.ansid;

    try {
        let relevanceScore = 0;

        const Ans = await Answer.findById(ansid).populate('questionId userId', 'content reputation');
        const Qus = Ans.questionId.content;


        const questionKeywords = extractKeywords(Qus);
        const answerKeywords = extractKeywords(Ans.content);

        const keywords = [...questionKeywords, ...answerKeywords];

        const uniqueKeywords = [...new Set(keywords)];

        let matchedscore = 0;
        uniqueKeywords.forEach((keyword) => {
            const questionText = Qus.toLowerCase();
            const answerText = Ans.content.toLowerCase();
            const keywordLower = keyword.toLowerCase();

            // Increase the relevance score if the keyword is found in the question or answer text
            if (questionText.includes(keywordLower) && answerText.includes(keywordLower)) {
                matchedscore += 1;
            }
        });

        relevanceScore = (matchedscore * 0.3); // keywords matching weight

        const convertedAns = htmlToText(Ans.content);
        let answerlength = convertedAns.length;

        // answer length weight
        if (answerlength < 80) {
            relevanceScore *= 0.1
        } else if (answerlength > 120) {
            relevanceScore *= 0.3
        } else {
            relevanceScore *= 0.2
        }

        //upvotes weight

        relevanceScore += (Ans.upvotes.length - Ans.downvotes.length) * 0.2;
        relevanceScore += (Ans.userId.reputation) * 0.1;


        const sentimentweight = SentimentAnalysis(convertedAns);
        // sentiment weight
        relevanceScore *= sentimentweight;

        const today = new Date();
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(today.getDate() - 10);
        const timeWeight = Ans.createdAt >= tenDaysAgo ? 1.7 : 1;

        relevanceScore += timeWeight * relevanceScore;

        Ans.relevanceScore = relevanceScore;
        await Ans.save();

        res.status(200).json({ success: true, message: "Updated success" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" });
    }
})

router.put('/request/petition/:petId/reputation', async (req, res) => {
    try {
        const petId = req.params.petId;

        const Pet = await Petition.findById(petId).populate('userId', 'role reputation')

        let relevanceScore = 0;

        relevanceScore += Pet.userId.reputation;
        relevanceScore += Pet.SignedBy.length;
        if (Pet.userId.role === "Student") {
            relevanceScore *= 0.3;
        }
        else {
            relevanceScore *= 0.7;
        }

        Pet.relevanceScore = relevanceScore;
        await Pet.save();

        res.status(200).json({ success: true, message: "Updated success" })

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" });
    }

})


router.put('/request/academicpost/:postid/reputation', async (req, res) => {
    try {
        const postid = req.params.postid;
        const post = await Academic.findById(postid).populate('userId', 'name email Profilepic reputation role')
        let relevanceScore = 0;
        const htmlContent = post.content;
        const $ = cheerio.load(htmlContent);

        // Extract image tags
        const imageTags = $('img');

        if (imageTags && imageTags.length != 0) {
            relevanceScore += imageTags.length;
        }
        relevanceScore += post.userId.reputation;
        relevanceScore += post.comments.length;

        if (post.userId.role === 'Student') {
            relevanceScore *= 0.4;
        }
        else {
            relevanceScore *= 0.6;
        }

        const today = new Date();
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(today.getDate() - 10);
        const timeWeight = post.createdAt >= tenDaysAgo ? 1.7 : 1;

        relevanceScore += timeWeight * relevanceScore;
        post.relevanceScore = relevanceScore;
        await post.save();

        res.status(200).json({ success: true, message: "Updated relevance score" });
    } catch (err) {

        console.log(err);
        res.status(500).json({ success: false, message: "Internal Error" });

    }
})
module.exports = router;
const { Router } = require('express');

const router = Router();
const multer = require('multer');
const upload = multer({ dest: 'public/images' });
const path = require('path');
const fs = require('fs')
const Academic = require('../Schema/AcademicHelpSchema');
const Comment = require('../Schema/CommentSchema');
const User = require('../Schema/UserSchema');
const Notification = require('../Schema/NotificationSchema');

router.post('/request/upload', upload.single('image'), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Generate a unique filename
  const uniqueFilename = `${Date.now()}-${req.file.originalname}`;

  // Define the desired storage location
  const storageLocation = path.join('public', 'images', uniqueFilename);

  // Move the uploaded file to the desired location
  fs.rename(req.file.path, storageLocation, (error) => {
    // console.log(req.file.path);
    if (error) {
      console.log('Error occurred while moving the file:', error);
      return res.status(500).json({ error: 'Failed to store the image' });
    }

    // Provide the URL or relative path of the stored image
    const imageUrl = `/images/${uniqueFilename}`;

    // Send the response with the image URL
    return res.status(200).json({ success: true, imageUrl });
  });
});

router.post('/request/addpost', async (req, res) => {
  const { text, title, userId, Desc } = req.body;

  try {
    const Pos = await Academic.create({
      userId: userId,
      title: title,
      Overview: Desc,
      content: text,
    })

    const user = await User.findById(userId);;
    user.PostsUploaded.push(Pos._id);
    await user.save();

    const subscribers = await User.find({ _id: { $in: user.subscribers } });

    await Notification.create({
      userId: user.id,
      subId: subscribers,
      link: `/post/${Pos.id}`,
      content: "A new AcdemicPost has been added by " + user.name,
    })

    res.status(200).json({ status: 200, post: Pos });
  }
  catch (err) {
    console.log(err);
    res.status(404).json({ message: "error" });
  }

})
router.post('/request/remove-images', async (req, res) => {
  const { imageUrls } = req.body;

  // Iterate over the imageUrls array
  imageUrls.forEach((imageUrl) => {
    // Get the filename from the imageUrl
    const filename = path.basename(imageUrl);
    // Construct the file path to the public/images folder
    const imagePath = path.join('public', 'images', filename);
    // Remove the image file using fs.unlink
    fs.unlink(imagePath, (err) => {
      if (err) {
        // Handle any errors that occur during file removal
        console.error(`Failed to remove image: ${imageUrl}`, err);
      } else {
        console.log(`Image removed: ${imageUrl}`);
      }
    });
  });
  res.status(200).json({ message: "deleted images" });
})


router.get('/request/posts', async (req, res) => {
  const { limit, skip, sortType } = req.query;
  try {

    switch (sortType) {
      case "latest":
        const latestpaginatedPosts = await Academic.find()
          .sort({ createdAt: -1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .populate('userId', 'email name Profilepic role')

        return res.json({ Posts: latestpaginatedPosts });

      case "oldest":
        const oldestpaginatedPosts = await Academic.find()
          .sort({ createdAt: 1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .populate('userId', 'email name Profilepic role')


        return res.json({ Posts: oldestpaginatedPosts });

      case "PopularChoice":
        const mostVotesPaginatedPosts = await Academic.aggregate([
          {
            $project: {
              userId: 1,
              content: 1,
              title: 1,
              Overview: 1,
              createdAt: 1,
              comments: 1,
              relevanceScore: 1,
              commentsCount: { $size: "$comments" }
            }
          },
          { $sort: { commentsCount: -1 } },
          { $skip: Number(skip) },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              userId: {
                _id: '$user._id',
                email: '$user.email',
                name: '$user.name',
                Profilepic: '$user.Profilepic',
                role: '$user.role'
              },
              content: 1,
              title: 1,
              Overview: 1,
              createdAt: 1,
              comments: 1,
              relevanceScore: 1,
            }
          }
        ]);

        return res.json({ Posts: mostVotesPaginatedPosts });

      case "relevance":
        const relavancepaginatedPosts = await Academic.find()
          .sort({ relevanceScore: -1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .populate('userId', 'email name Profilepic role')


        return res.json({ Posts: relavancepaginatedPosts });
      default:
        return [];
    }

    // const Posts = await Academic.find()
    //   .populate('userId', 'name email Profilepic role')
    //   .limit(Number(limit))
    //   .skip(Number(skip))

    // console.log(Posts);
    // res.send({
    //   Posts: Posts,
    //   status: 200,
    // })
  } catch (err) {
    console.log(err);
    res.status(404).json({ Posts: [] });
  }
})
router.post('/request/postcomment', async (req, res) => {
  const { comment, PostId, userId } = req.body;

  try {
    const post = await Academic.findById(PostId);

    if (!post) {
      return res.send({
        status: 400,
        message: "not fount"
      })
    }

    const cid = await Comment.create({
      userId: userId,
      content: comment,
      Postid: PostId,
    })
    post.comments.push(cid._id)
    await post.save();

    const user = await User.findById(userId);
    user.Commentsposted.push(cid._id);
    await user.save();

    res.send({ status: 200, message: "success" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "error" })
  }
})

router.get('/request/getcomments', async (req, res) => {
  const { PostId } = req.query;
  try {
    const comments = await Comment.find({ Postid: PostId })
      .populate('userId', 'name email Profilepic')

    // console.log(comments);
    res.send({
      status: 200,
      comments: comments
    })
  }
  catch (err) {
    console.log(err);
    res.send({
      status: 404,
      message: "error"
    })
  }
})

router.get('/request/post', async (req, res) => {
  const { PostId } = req.query;
  try {

    const post = await Academic.find({ _id: PostId })
      .populate('userId comments.userId', 'name email Profilepic')

    if (post) {
      res.send({
        status: 200,
        post: post,
      })
    } else {
      res.send({
        status: 400,
        post: [],
      })
    }

  } catch (err) {
    console.log("catching the errpr" + err);
    res.send({
      status: 404,
      message: "error"
    })
  }
})

module.exports = router;

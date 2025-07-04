import ForumPost from '../models/ForumPost.js';
import ForumComment from '../models/ForumComment.js';

export const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const post = new ForumPost({
      author: req.user.id,
      title,
      content,
      tags
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { tag, solved, sort = '-createdAt' } = req.query;
    let query = {};
    
    if (tag) query.tags = tag;
    if (solved !== undefined) query.isSolved = solved === 'true';

    // Handle different sort options
    let sortOption = {};
    switch (sort) {
      case '-upvotes':
        sortOption = { 'upvotes.length': -1 };
        break;
      case '-createdAt':
      default:
        sortOption = { createdAt: -1 };
    }

    const posts = await ForumPost.find(query)
      .sort(sortOption)
      .populate('author', 'name')
      .select('-downvotes -upvotes');
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPost = async (req, res) => {
  try {
    console.log("hi")
    const post = await ForumPost.findById(req.params.postId)
      .populate('author', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name' }
      });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    
    const comment = new ForumComment({
      post: postId,
      author: req.user.id,
      content
    });
    
    await comment.save();
    
    // Update post's comments array and answer count
    await ForumPost.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
      $inc: { answerCount: 1 }
    });
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsAnswer = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const post = await ForumPost.findById(comment.post);
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the post author can mark answers' });
    }
    
    comment.isAnswer = true;
    post.isSolved = true;
    
    await Promise.all([comment.save(), post.save()]);
    
    res.json({ message: 'Comment marked as answer' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }
    
    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;
    
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    await ForumComment.deleteMany({ post: post._id });
    await post.deleteOne();
    
    res.json({ message: 'Post and associated comments deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await ForumComment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    
    comment.content = content;
    await comment.save();
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    
    // Update post's comments array and answer count
    await ForumPost.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
      $inc: { answerCount: -1 }
    });
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const votePost = async (req, res) => {
  try {
    const { type, voteType } = req.body;
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const userId = req.user.id;

    if (type === 'remove') {
      // Remove vote
      if (voteType === 'up') {
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
      } else {
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
      }
    } else {
      // Add or change vote
      if (type === 'up') {
        if (!post.upvotes.includes(userId)) {
          post.upvotes.push(userId);
          post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
        }
      } else if (type === 'down') {
        if (!post.downvotes.includes(userId)) {
          post.downvotes.push(userId);
          post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
        }
      }
    }
    
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const voteComment = async (req, res) => {
  try {
    const { type, voteType } = req.body;
    const comment = await ForumComment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const userId = req.user.id;

    if (type === 'remove') {
      // Remove vote
      if (voteType === 'up') {
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
      } else {
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
      }
    } else {
      // Add or change vote
      if (type === 'up') {
        if (!comment.upvotes.includes(userId)) {
          comment.upvotes.push(userId);
          comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
        }
      } else if (type === 'down') {
        if (!comment.downvotes.includes(userId)) {
          comment.downvotes.push(userId);
          comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
        }
      }
    }
    
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

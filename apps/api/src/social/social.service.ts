import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { prisma } from '@terraflow/database';
import { LiveGateway } from '../gateway/live.gateway.js';

@Injectable()
export class SocialService {
  declare private liveGateway: LiveGateway;

  constructor(@Inject(LiveGateway) liveGateway: LiveGateway) {
    this.liveGateway = liveGateway;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
      throw new NotFoundException('Target user not found.');
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });

    if (existing) {
      // Unfollow mutation
      await prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId }
        }
      });
      return { followed: false, message: 'Unfollowed user successfully.' };
    }

    // Follow mutation
    const follow = await prisma.follow.create({
      data: { followerId, followingId }
    });

    // Fire real-time WebSocket notification to the target user
    const follower = await prisma.user.findUnique({ where: { id: followerId } });
    if (follower) {
      const notif = await prisma.notification.create({
        data: {
          userId: followingId,
          type: 'FOLLOW',
          title: 'New Follower!',
          message: `${follower.name} (@${follower.username}) started following you.`,
          referenceId: followerId,
        }
      });

      this.liveGateway.sendLiveNotification(followingId, {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        referenceId: notif.referenceId || undefined,
      });
    }

    return { followed: true, message: 'Followed user successfully.' };
  }

  async likePost(userId: string, postId: string) {
    const [post, existing, liker] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.like.findUnique({
        where: {
          postId_userId: { postId, userId }
        }
      }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (existing) {
      // Unlike mutation
      await prisma.like.delete({
        where: {
          postId_userId: { postId, userId }
        }
      });
      return { liked: false, message: 'Unliked post successfully.' };
    }

    // Like mutation with transaction
    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: { postId, userId }
      });

      // Fire real-time notification to the post owner if it's someone else
      if (post.userId !== userId && liker) {
        const notif = await tx.notification.create({
          data: {
            userId: post.userId,
            type: 'LIKE',
            title: 'Post Liked!',
            message: `${liker.name} liked your post "${post.title}".`,
            referenceId: postId,
          }
        });

        this.liveGateway.sendLiveNotification(post.userId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          referenceId: notif.referenceId || undefined,
        });
      }
    });

    return { liked: true, message: 'Liked post successfully.' };
  }

  async addComment(userId: string, postId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty.');
    }

    const [post, commenter] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const comment = await prisma.comment.create({
      data: { postId, userId, content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          }
        }
      }
    });

    // Fire notification to the post owner if it's someone else
    if (post.userId !== userId && commenter) {
      await prisma.$transaction(async (tx) => {
        const notif = await tx.notification.create({
          data: {
            userId: post.userId,
            type: 'COMMENT',
            title: 'New Comment!',
            message: `${commenter.name} commented on your post "${post.title}": "${content.substring(0, 30)}..."`,
            referenceId: postId,
          }
        });

        this.liveGateway.sendLiveNotification(post.userId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          referenceId: notif.referenceId || undefined,
        });
      });
    }

    return comment;
  }

  async savePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const existing = await prisma.savedPost.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: {
          postId_userId: { postId, userId }
        }
      });
      return { saved: false, message: 'Removed post from bookmarks.' };
    }

    await prisma.savedPost.create({
      data: { postId, userId }
    });

    return { saved: true, message: 'Saved post to bookmarks.' };
  }

  async getComments(postId: string) {
    return prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePic: true,
          }
        }
      }
    });
  }
}

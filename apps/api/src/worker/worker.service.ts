import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@terraflow/database';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private redisConnection!: Redis;
  private mediaQueue!: Queue;
  private queueWorker!: Worker;

  async onModuleInit() {
    // Connect to Redis (fallback to localhost)
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

    // Establish BullMQ Queue
    this.mediaQueue = new Queue('terraflow-media-processing', {
      connection: this.redisConnection as any,
    });

    // Establish BullMQ worker to consume background tasks
    this.queueWorker = new Worker(
      'terraflow-media-processing',
      async (job: Job) => {
        console.log(`Processing background job ${job.id} of type ${job.name}`);
        switch (job.name) {
          case 'analyze-post-ai':
            await this.handleAIPostAnalysis(job.data);
            break;
          case 'unlock-capsules':
            await this.handleCapsuleUnlocks();
            break;
          default:
            console.warn(`Unknown job name: ${job.name}`);
        }
      },
      { connection: this.redisConnection as any }
    );

    this.queueWorker.on('completed', (job) => {
      console.log(`Background Job ${job.id} finished successfully.`);
    });

    this.queueWorker.on('failed', (job, err) => {
      console.error(`Background Job ${job?.id} failed with error:`, err);
    });

    // Setup periodic task checks
    setInterval(() => {
      this.addUnlockCapsulesJob().catch(console.error);
    }, 60000); // Trigger check every minute
  }

  async onModuleDestroy() {
    await this.queueWorker.close();
    await this.mediaQueue.close();
    this.redisConnection.disconnect();
  }

  async enqueueAIPostAnalysis(postId: string) {
    await this.mediaQueue.add('analyze-post-ai', { postId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  private async addUnlockCapsulesJob() {
    // Add unique job to check capsules
    await this.mediaQueue.add('unlock-capsules', {}, {
      jobId: `capsules-check-${Math.floor(Date.now() / 60000)}`,
      removeOnComplete: true,
    });
  }

  private async handleAIPostAnalysis(data: { postId: string }) {
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
      include: { media: true }
    });

    if (!post) return;

    // AI Recognition & Tagging Simulation (e.g., OpenAI / Gemini integration)
    console.log(`Simulating AI analyses for Post: ${post.title}`);
    const generatedTags = ['travel', 'explore'];

    // Sample dynamic tag append based on location context
    if (post.latitude > 48.8 && post.latitude < 48.9 && post.longitude > 2.2 && post.longitude < 2.4) {
      generatedTags.push('architecture', 'landmark', 'eiffel-tower', 'paris');
    } else if (post.latitude > 18.9 && post.latitude < 19.1 && post.longitude > 72.8 && post.longitude < 73.0) {
      generatedTags.push('gateway-of-india', 'mumbai', 'seaside');
    }

    const finalTags = Array.from(new Set([...post.tags, ...generatedTags]));

    // Auto-Moderation check: Flag offensive titles/descriptions
    const offensiveKeywords = ['spam', 'abuse', 'malicious'];
    const needsModeration = offensiveKeywords.some(keyword => 
      post.title.toLowerCase().includes(keyword) || 
      (post.description && post.description.toLowerCase().includes(keyword))
    );

    await prisma.post.update({
      where: { id: post.id },
      data: {
        tags: finalTags,
        isModerated: needsModeration,
      }
    });

    if (needsModeration) {
      // Auto create system moderation report
      await prisma.report.create({
        data: {
          reporterId: post.userId,
          postId: post.id,
          reason: 'Auto-Moderator flagged offensive keywords in post context.',
        }
      });
      console.log(`Auto-Moderator: Post ${post.id} flagged and report generated.`);
    }
  }

  private async handleCapsuleUnlocks() {
    const lockedCapsules = await prisma.memoryCapsule.findMany({
      where: {
        status: 'LOCKED',
        unlockDate: { lte: new Date() }
      }
    });

    if (lockedCapsules.length === 0) return;

    console.log(`Found ${lockedCapsules.length} Memory Capsules ready to unlock.`);

    for (const capsule of lockedCapsules) {
      await prisma.$transaction([
        prisma.memoryCapsule.update({
          where: { id: capsule.id },
          data: { status: 'UNLOCKED' }
        }),
        prisma.notification.create({
          data: {
            userId: capsule.userId,
            type: 'CAPSULE_UNLOCK',
            title: 'Memory Capsule Unlocked!',
            message: `Your capsule "${capsule.title}" created on ${capsule.createdAt.toLocaleDateString()} has unlocked. Open it on the globe!`,
            referenceId: capsule.id,
          }
        })
      ]);
      console.log(`Unlocked capsule: ${capsule.id}`);
    }
  }
}

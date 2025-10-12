import { Request, Response } from "express";
import { successResponse } from "../../utils/Response/success.response";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/Repository";
import { HUserDocument, UserModel } from "../../DB/models/User.model";
import { AvailabilityEnum, HPostDocument, LikeActionEnum, PostModel } from "../../DB/models/Post.model";
import { Types, UpdateQuery } from "mongoose";
import { deleteFiles, uploadFilesOrLargeFiles } from "../../utils/Multer/S3.config";
import { BadRequestException, NotFoundException } from "../../utils/Response/error.response";
import { nanoid } from "nanoid";
import { IActionPostQueryDto, IPostLikeParamsDto } from "./post.dto";
import { CommentModel } from "../../DB/models/Comment.model";
import { connectedSockets, getIo } from "../Gateway";
import { GraphQLError } from "graphql";



export function postAvailability(user: HUserDocument) {
    return [
        { availability: AvailabilityEnum.pubic },
        { availability: AvailabilityEnum.onlyMe, createdBy: user._id },
        { availability: AvailabilityEnum.friends, createdBy: { $in: [...(user.friends || []), user._id] } },
        {
            availability: { $ne: AvailabilityEnum.onlyMe },
            tags: { $in: user._id }
        },
        {
            availability: AvailabilityEnum.friendsExcept,
            Except: {
                $nin: [user._id]
            },
            
           
            
        },
        {
            availability: AvailabilityEnum.specificFriends,
            $or: [
                {
                    Only: {
                        $in: [user._id]
                    }
                },
                { createdBy: user._id }
            ]
        }
    ];

}

function isAvailability(post: HPostDocument, req: Request) {
    const case1 = (post?.availability === AvailabilityEnum.onlyMe && String(post.createdBy) !== String(req.user?._id));
  console.log(case1);
  
    const case2 = (post?.availability === AvailabilityEnum.friends && !req.user?.friends?.includes(post.createdBy as Types.ObjectId));

    console.log(case2);
    

    const case3 = (post?.availability === AvailabilityEnum.friendsExcept && post.Except.includes(req.user?._id as Types.ObjectId));
    console.log(case3);
    
    const case4 = (post?.availability === AvailabilityEnum.specificFriends && !post.Only.includes(req.user?._id as Types.ObjectId));

    console.log(case4);
   
    
    return case1 || case2 || case3 || case4 || req.user?.BlockList.includes(post.createdBy) ? true : false;
}

export class PostService {
  private userModel = new UserRepository(UserModel);
  private postModel = new PostRepository(PostModel);
  private commentModel = new CommentRepository(CommentModel);

  constructor() {}

  createPost = async (req: Request, res: Response): Promise<Response> => {
    if (
      (req.body.tags &&
        (
          await this.userModel.find({
            filter: {
              _id: { $in: req.body.tags, $ne: req.user?._id },
              BlockList: { $nin: req.user?._id },
            },
          })
        ).length !== req.body.tags.length) ||
      req.body.tags?.some((tag: Types.ObjectId) =>
        req.user?.BlockList.includes(tag)
      )
    ) {
      throw new NotFoundException("Some of mentioned users are not exist");
    }

    let attachments: string[] = [];
    const assetsFolderId = nanoid();

    if (req.files?.length) {
      attachments = await uploadFilesOrLargeFiles({
        files: req.files as Express.Multer.File[],
        path: `user/${req.decoded?._id}/post/${assetsFolderId}`,
      });
    }

    const [post] =
      (await this.postModel.create({
        data: [
          {
            ...req.body,
            attachments,
            createdBy: req.user?._id as Types.ObjectId,
            assetsFolderId,
          },
        ],
      })) || [];

    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail to create this post");
    }
    return successResponse({
      res,
      statusCode: 201,
      message: "Created Post Successfully",
    });
  };

  likePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as IPostLikeParamsDto;
    const { action } = req.query as IActionPostQueryDto;

    let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: req.user?._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = {
        $pull: { likes: req.user?._id },
      };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(req.user as HUserDocument),
        createdBy: { $nin: req.user?.BlockList || [] },
      },
      update,
    });

    if (
      !post ||
      !(await this.userModel.findOne({
        filter: {
          _id: post?.createdBy,
          BlockList: { $nin: [req.user?._id] },
        },
      }))
    ) {
      throw new NotFoundException("Post not exist or In-valid postId");
    }

    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit("likePost", {
          postId,
          userId: req.user?._id,
        });
    }

    return successResponse({ res });
  };

  updatePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
      },
    });
    if (!post) {
      throw new NotFoundException("");
    }

    // if (req.body.removedAttachments?.length && post.attachments?.length) {
    //     post.attachments = post.attachments?.filter((attachment: string) => {
    //         if (!req.body.removedAttachments.includes(attachment)) {
    //             return attachment;
    //         }
    //         return;
    //     });
    // }
    if (
      (req.body.tags &&
        (
          await this.userModel.find({
            filter: {
              _id: { $in: req.body.tags, $ne: req.user?._id },
              BlockList: { $nin: req.user?._id },
            },
          })
        ).length !== req.body.tags.length) ||
      req.body.tags?.some((tag: Types.ObjectId) =>
        req.user?.BlockList.includes(tag)
      )
    ) {
      throw new NotFoundException("Some of mentioned users are not exist");
    }

    let attachments: string[] = [];

    if (req.files?.length) {
      attachments = await uploadFilesOrLargeFiles({
        files: req.files as Express.Multer.File[],
        path: `user/${req.user?._id}/post/${post.assetsFolderId}`,
      });
      // post.attachments = [...(post.attachments || []), ...attachments];
    }

    // const updatedPost = await this.postModel.updateOne({
    //     filter: {
    //         _id:postId
    //     },
    //     update: {
    //         content: req.body.content,
    //         allowComments: req.body.allowComments || [],
    //         availability: req.body.availability || [],
    //         attachments: post.attachments,
    //          $addToSet: {
    //             attachments: {$each:attachments|| []},
    //             tags: { $each: req.body.tags || [] }
    //         }
    //     }
    // })

    // const updatedPost2 = await this.postModel.updateOne({
    //     filter: {
    //         _id: postId
    //     },
    //     update: {
    //         content: req.body.content,
    //         allowComments: req.body.allowComments || [],
    //         availability: req.body.availability || [],
    //         $pull: {
    //             attachments: { $in: req.body.removedAttachments || [] },
    //             tags: { $in: req.body.removedTags || [] }
    //         }
    //     }
    // });

    const updatedPost = await this.postModel.updateOne({
      filter: {
        _id: postId,
      },
      update: [
        {
          $set: {
            content: req.body.content,
            allowComments: req.body.allowComments || [],
            availability: req.body.availability || [],
            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    "$attachments",
                    req.body.removedAttachments || [],
                  ],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "$tags",
                    (req.body.removedTags || []).map((tag: string) => {
                      return Types.ObjectId.createFromHexString(tag);
                    }),
                  ],
                },
                (req.body.tags || []).map((tag: string) => {
                  return Types.ObjectId.createFromHexString(tag);
                }),
              ],
            },
          },
        },
      ],
    });

    if (!updatedPost.matchedCount) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail to create this post");
    } else {
      if (req.body.removedAttachments?.length) {
        await deleteFiles({ urls: req.body.removedAttachments });
      }
    }
    return successResponse({ res, message: "Updated Post Successfully" });
  };

  postsList = async (req: Request, res: Response): Promise<Response> => {
    let { page, size } = req.query as unknown as { page: number; size: number };

    const posts = await this.postModel.paginate({
      filter: {
        $or: postAvailability(req.user as HUserDocument),
        createdBy: { $nin: req.user?.BlockList || [] },
      },
      page,
      size,
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
              deletedAt: {
                $exists: false,
              },
            },
            populate: [
              {
                path: "reply",
                match: {
                  commentId: { $exists: false },
                  deletedAt: {
                    $exists: false,
                  },
                },
                populate: [
                  {
                    path: "reply",
                    match: {
                      commentId: { $exists: false },
                      deletedAt: {
                        $exists: false,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    //   if (!posts || !(await this.userModel.find({
    //     filter: {
    //         _id: posts?.createdBy,
    //         BlockList: { $nin: [req.user?._id] }
    //     }
    // }))){
    //     throw new NotFoundException("Post not exist or In-valid postId");
    // }

    return successResponse({ res, data: posts });
  };

  getPostWithComments = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const posts = await this.postModel.findCursor({
      filter: {
        $or: postAvailability(req.user as HUserDocument),
        createdBy: { $nin: req.user?.BlockList || [] },
      },
    });

    //   if (!posts || !(await this.userModel.find({
    //     filter: {
    //         _id: posts?.createdBy,
    //         BlockList: { $nin: [req.user?._id] }
    //     }
    // }))){
    //     throw new NotFoundException("Post not exist or In-valid postId");
    // }

    return successResponse({ res, data: posts });
  };

  getPostById = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    const post = await this.postModel.findById({
      id: postId,
    });

    if (
      !post ||
      !(await this.userModel.findOne({
        filter: {
          _id: post?.createdBy,
          BlockList: { $nin: [req.user?._id] },
        },
      }))
    ) {
      throw new NotFoundException("Post not exist or In-valid postId");
    }

    if (isAvailability(post, req)) {
      throw new NotFoundException("Fail to find matching result");
    }

    return successResponse({
      res,
      data: {
        post,
      },
    });
  };

  freezePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    await Promise.all([
      await this.postModel.findOneAndUpdate({
        filter: {
          _id: postId,
          createdBy: req.user?._id,
        },
        update: {
          deletedBy: req.user?._id,
          deletedAt: new Date(),
        },
      }),

      await this.commentModel.updateMany({
        filter: {
          postId,
        },
        update: {
          deletedBy: req.user?._id,
          deletedAt: new Date(),
        },
      }),
    ]);

    return successResponse({
      res,
    });
  };

  deletePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    await Promise.all([
      await this.postModel.findOneAndDelete({
        filter: {
          _id: postId,
          createdBy: req.user?._id,
          deletedBy: { $exists: true },
          deletedAt: { $exists: true },
        },
      }),

      await this.commentModel.deleteMany({
        filter: {
          postId,
        },
      }),
    ]);

    return successResponse({
      res,
    });
  };

  // GraphQl
  allPosts = async (
    {
      page,
      size,
    }: {
      page: number;
      size: number;
    },
    authUser: HUserDocument
  ): Promise<{
    docsCount?: number;
    pages?: number;
    currentPage?: number | undefined;
    limit?: number;
    result: HPostDocument[];
  }> => {
    const posts = await this.postModel.paginate({
      filter: {
        $or: postAvailability(authUser),
        createdBy: { $nin: authUser.BlockList || [] },
      },
      page,
      size,
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
              deletedAt: {
                $exists: false,
              },
            },
            populate: [
              {
                path: "reply",
                match: {
                  commentId: { $exists: false },
                  deletedAt: {
                    $exists: false,
                  },
                },
                populate: [
                  {
                    path: "reply",
                    match: {
                      commentId: { $exists: false },
                      deletedAt: {
                        $exists: false,
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            path: "createdBy",
          },
        ],
      },
    });
    return posts;
  };

  likeGraphQlPost = async (
      { postId, action }: { postId: string; action: LikeActionEnum },
    authUser: HUserDocument
  ): Promise<HPostDocument> => {
      
    let update: UpdateQuery<HPostDocument> = {
      $addToSet: { likes: authUser._id },
    };

    if (action === LikeActionEnum.unlike) {
      update = {
        $pull: { likes: authUser._id },
      };
    }

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(authUser as HUserDocument),
        createdBy: { $nin: authUser.BlockList || [] },
      },
      update,
    });

    if (
      !post ||
      !(await this.userModel.findOne({
        filter: {
          _id: post?.createdBy,
          BlockList: { $nin: [authUser._id] },
        },
      }))
    ) {
      throw new GraphQLError("Post not exist or In-valid postId");
    }

    if (action !== LikeActionEnum.unlike) {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit("likePost", {
          postId,
            userId: authUser._id,
        });
    }

      return post;
  };
}

export const postService = new PostService();

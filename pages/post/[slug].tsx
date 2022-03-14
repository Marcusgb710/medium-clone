import { GetStaticProps } from "next";
import Header from "../../components/Header"
import { sanityClient, urlFor } from "../../sanity"
import { Post } from "../../typings";
import PortableText from 'react-portable-text';
import { useForm, SubmitHandler, appendErrors } from 'react-hook-form';
import { useState } from "react";

interface Props{
    post: Post;


}

interface IFormInput{
    _id: string;
    name: string;
    email: string;
    comment: string;
}

function Post({ post }: Props) {

    console.log(post);

    const [submit, setSubmit] = useState(false);

    const { register, handleSubmit, formState:{ errors }} = useForm<IFormInput>();


    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        fetch('/api/createComment', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then(()=>{
            console.log(data);
            setSubmit(true);
        }).catch((err) => {
            console.log(err);
            setSubmit(false);
        })
    };  
  return (
    <main>
        <Header />

        <img 
        className='w-full h-40 object-cover'
        src = {urlFor(post.mainImage).url()}
        alt='Post Image'
        />


        <article 
        className='max-w-3xl mx-auto p-5'
        >
            <h1
            className='text-3xl mt-10 mb-3'
            >
                {post.title}
            </h1>
            <h2
            className='text-xl font-light text-grey-500 mb-2'
            >
                {post.description}
            </h2>

            <div
            className='flex items-center space-x-2'
            >
                <img 
                className='h-10 w-10 rounded-full'
                src={urlFor(post.author.image).url()} 
                alt="" 
                />
                <p
                className='font-extralight text-sm'
                >
                    Blog post by <span className='text-green-600'>{post.author.name}</span> - Published at{" "}{new Date(post._createdAt).toLocaleString()}
                </p>
            </div>
            <div
            className="mt-10"
            >
                <PortableText
                dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
                projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
                content ={post.body}
                serializers={
                {
                    h1: (props: any) =>{
                        <h1 className='text-2xl font-bold my-5' {...props}/>
                    },
                    h2: (props: any) =>{
                        <h2 className='text-2xl font-bold my-5' {...props}/>
                    },
                    li: ({ children }: any) =>{
                        <li className='ml-4 list-disc'>
                            {children}
                        </li>
                    },
                    link: ({ href, children }: any) =>{
                        <a href={href} className='text-blue-500 hover:underline'>
                            {children}
                        </a>
                    },
                }

                }
                />
            </div>


        </article>
        <hr className='max-w-lg my-5 mx-auto border border-yellow-500' />
        {submit ? (<div
        className='flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto'
        >
            <h3
            className='text-3xl font-bold'
            >
                Thanks for submitting your comment!
            </h3>
            <p>
                Once it has been approved your comment will be posted.
            </p>
        </div> ): (
        <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col p-5 max-w-2xl mx-auto mb-10'
        >
            <input
            {...register("_id")}
            type='hidden'
            name='_id'
            value={post._id}
            />
            <label className='block mb-5'>
                <span className='text-grey-700 '>
                    Name
                </span>
                <input  {...register("name", { required:true })} className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring ring-0' placeholder='John appleseed' type='text'/>
            </label>
            <label className='block mb-5'>
                <span className='text-grey-700 '>
                    Email
                </span>
                <input {...register("email", { required:true })} className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring ring-0' placeholder='John appleseed' type='text'/>
            </label>
            <label className='block mb-5'>
                <span className='text-grey-700 '>
                    Comment
                </span>
                <textarea {...register("comment", { required:true })} className='shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring ring-0' placeholder='John appleseed' rows={8}/>
            </label>

            <div
            className='flex flex-col items-center mb-5'
            >
                {errors.name &&(
                    <span className='text-red-500'>
                        The Name Field is Required!
                    </span>
                )}
                {errors.email &&(
                    <span className='text-red-500'>
                        The Email Field is Required!
                    </span>
                )}
                {errors.comment &&(
                    <span className='text-red-500'>
                        The Command Field is Required!
                    </span>
                )}
            </div>
            <input 
            className='shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-4 px-4 rounded cursor-pointer'
            type='submit'
            />
        </form>)}

        {/* Comments */}
        <div className='flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500  shadow space-y-2'>
            <h3 className='text-4xl'>
                Comments
            </h3>

            <br className='pb-2'/>
            {post.comments.map(( content ) => (
                <div key={ content._id }>
                    <p>
                        <span className='text-yellow-500'>{content.name}</span>: <span>{content.comment}</span>
                    </p>
                </div>
            ))}
        </div>
    </main>
  )
}

export default Post;

export const getStaticPaths = async () =>{
    const query =`*[_type == "post"]{
        _id,
        slug{
        current
      }
      }`;

      const posts = await sanityClient.fetch(query);

      const paths = posts.map((post: Post) => ({
          params:{
              slug: post.slug.current,
          },


      }));

      return{
          paths, 
          fallback:'blocking',
      };

};

export const getStaticProps: GetStaticProps = async ({ params }) =>{
   const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    author ->{
    name,
    image
  },
  'comments': *[_type == 
               "comment" &&
               post._ref == ^._id &&
               approved == true],
   description,
  mainImage,
  slug,
  body
  }`;

  const post = await sanityClient.fetch(query, {
      slug: params?.slug
  });
  console.log(post);

  if (!post){
      return {
          notFound: true
      }
    }
    return{
        props:{
            post,
        },
        revalidate: 60,
    }
};





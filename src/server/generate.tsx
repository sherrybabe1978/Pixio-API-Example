"use server";

import { ComfyDeployClient } from "@/lib/comfy-deploy";

const client = new ComfyDeployClient({
  apiBase: process.env.COMFY_API_URL,
  apiToken: process.env.COMFY_API_TOKEN!,
});

export async function generate(positive_prompt: string, seed: string) {
  return await client.run({
    deployment_id: process.env.COMFY_DEPLOYMENT_ID!,
    inputs: {
      positive_prompt: positive_prompt,
      seed: seed,
    },
  });
}

export async function generate_img(input_image: string, seed: string) {
  return await client.run({
    deployment_id: process.env.COMFY_DEPLOYMENT_ID_IMG_2_IMG!,
    inputs: {
      input_image: input_image,
      seed: seed,
    },
  });
}

export async function generate_img_with_controlnet(
  input_openpose_url: string,
  prompt: string,
  seed: string
) {
  return await client.run({
    deployment_id: process.env.COMFY_DEPLOYMENT_ID_CONTROLNET!,
    inputs: {
      positive_prompt: prompt,
      openpose: input_openpose_url,
      seed: seed,
    },
  });
}

export async function checkStatus(run_id: string) {
  return await client.getRun(run_id);
}

export async function getUploadUrl(type: string, file_size: number) {
  try {
    return await client.getUploadUrl(type, file_size);
  } catch (error) {
    console.log(error);
  }
}

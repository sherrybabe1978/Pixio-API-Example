"use client";

import { LoadingIcon } from "@/components/LoadingIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label"; //Removed Input import
import { Skeleton } from "@/components/ui/skeleton";
import {
  checkStatus,
  generate,
  generate_img,
  generate_img_with_controlnet,
  getUploadUrl,
} from "@/server/generate";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerationResult } from "@/components/ImageGenerationResult";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between mt-10">
      <Tabs defaultValue="txt2img" className="w-full max-w-[600px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="txt2img">txt2img</TabsTrigger>
          {/* <TabsTrigger value="img2img">img2img</TabsTrigger>
          <TabsTrigger value="controlpose">Controlpose</TabsTrigger> */}
        </TabsList>
        <TabsContent value="txt2img">
          <Txt2img />
        </TabsContent>
        <TabsContent value="img2img">
          <Img2img />
        </TabsContent>
        <TabsContent value="controlpose">
          <OpenposeToImage />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Txt2img() {
  const [positivePrompt, setPositivePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [runIds, setRunIds] = useState<string[]>([]);

  // Function to generate a random 8-digit seed
  const generateRandomSeed = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  return (
    <Card className="w-full max-w-[600px]">
      <CardHeader>
        WHAT THE LLM IMAGE GENERATOR V1
        <div className="text-xs text-foreground opacity-50">
          text2img -{" "}
          <a href="https://myapps.ai">
            create realistic images, anime, art and logos
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid w-full items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();

            if (loading) return;
            setLoading(true);

            const newSeed = generateRandomSeed();

            const promises = Array(1)
              .fill(null)
              .map(() => {
                return generate(positivePrompt, newSeed)
                  .then((res) => {
                    if (res) {
                      setRunIds((ids) => [...ids, res.run_id]);
                    }
                    return res;
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              });

            Promise.all(promises).finally(() => {
              setLoading(false);
            });
          }}
        >
          <Label htmlFor="positive-prompt">Positive prompt</Label>
          <textarea
            id="positive-prompt"
            rows={4}
            value={positivePrompt}
            onChange={(e) => setPositivePrompt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" className="flex gap-2" disabled={loading}>
            Generate {loading && <LoadingIcon />}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            {runIds.map((runId, index) => (
              <ImageGenerationResult key={index} runId={runId} />
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Img2img() {
  const [prompt, setPrompt] = useState<File>();
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState("");
  const [status, setStatus] = useState<string>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setPrompt(e.target.files[0]);
  };

  // Function to generate a random 8-digit seed
  const generateRandomSeed = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  // Polling in frontend to check for the
  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(() => {
      checkStatus(runId).then((res) => {
        if (res) setStatus(res.status);
        if (res && res.status === "success") {
          console.log(res.outputs[0]?.data);
          setImage(res.outputs[0]?.data?.images[0].url);
          setLoading(false);
          clearInterval(interval);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  return (
    <Card className="w-full max-w-[600px]">
      <CardHeader>Comfy Deploy - Scribble to Anime Girl</CardHeader>
      <CardContent>
        <form
          className="grid w-full items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (loading) return;
            if (!prompt) return;

            setImage("");

            setStatus("getting url for upload");

            console.log(prompt?.type, prompt?.size);

            const newSeed = generateRandomSeed();

            getUploadUrl(prompt?.type, prompt?.size).then((res) => {
              if (!res) return;

              setStatus("uploading input");

              console.log(res);

              fetch(res.upload_url, {
                method: "PUT",
                body: prompt,
                headers: {
                  "Content-Type": prompt.type,
                  "x-amz-acl": "public-read",
                  "Content-Length": prompt.size.toString(),
                },
              }).then((_res) => {
                if (_res.ok) {
                  setStatus("uploaded input");

                  setLoading(true);
                  generate_img(res.download_url, newSeed).then((res) => {
                    console.log(res);
                    if (!res) {
                      setStatus("error");
                      setLoading(false);
                      return;
                    }
                    setRunId(res.run_id);
                  });
                  setStatus("preparing");
                }
              });
            });
          }}
        >
          <Label htmlFor="picture">Image prompt</Label>
          <input
            id="picture"
            type="file"
            onChange={handleFileChange}
            required
          />
          <Button type="submit" className="flex gap-2" disabled={loading}>
            Generate {loading && <LoadingIcon />}
          </Button>

          {runId && (
            <ImageGenerationResult
              key={runId}
              runId={runId}
              className="aspect-square"
            />
          )}
        </form>
      </CardContent>
    </Card>
  );
}

const poses = {
  arms_on_hips: {
    url: "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(1).png",
    name: "Arms on Hips",
  },
  waving: {
    url: "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(2).png",
    name: "Waving",
  },
  legs_together_sideways: {
    url: "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(3).png",
    name: "Legs together, body at an angle",
  },
  excited_jump: {
    url: "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(4).png",
    name: "Excited Jump",
  },
  pointing_to_the_stars: {
    url: "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(5).png",
    name: "Pointing to the Stars",
  },
};

function OpenposeToImage() {
  const [prompt, setPrompt] = useState("");
  const [poseImageUrl, setPoseImageUrl] = useState(
    "https://pub-6230db03dc3a4861a9c3e55145ceda44.r2.dev/openpose-pose%20(1).png"
  );
  const [poseLoading, setPoseLoading] = useState(false);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState("");
  const [status, setStatus] = useState<string>();

  const handleSelectChange = (value: keyof typeof poses) => {
    setPoseImageUrl(poses[value].url); // Update image based on selection
  };

  // Function to generate a random 8-digit seed
  const generateRandomSeed = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  // Polling in frontend to check for the
  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(() => {
      checkStatus(runId).then((res) => {
        if (res) setStatus(res.status);
        if (res && res.status === "success") {
          console.log(res.outputs[0]?.data);
          setImage(res.outputs[0]?.data?.images[0].url);
          setLoading(false);
          clearInterval(interval);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  return (
    <Card className="w-full max-w-[600px]">
      <CardHeader>
        Comfy Deploy - Pose Creator Tool
        <div className="text-xs text-foreground opacity-50">
          OpenPose -{" "}
          <a href="https://civitai.com/models/13647/super-pose-book-vol1-controlnet">
            pose book
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid w-full items-center gap-1.5"
          onSubmit={(e) => {
            if (loading) return;

            e.preventDefault();
            setLoading(true);
            const newSeed = generateRandomSeed();
            generate_img_with_controlnet(poseImageUrl, prompt, newSeed).then(
              (res) => {
                console.log("here", res);
                if (!res) {
                  setStatus("error");
                  setLoading(false);
                  return;
                }
                setRunId(res.run_id);
              }
            );
            setStatus("preparing");
          }}
        >
          <Select
            defaultValue={"arms_on_hips"}
            onValueChange={(value) => {
              handleSelectChange(value as keyof typeof poses);
              setPoseLoading(true); // Start loading when a new pose is selected
            }}
          >
            <Label htmlFor="pose">Pose</Label>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a Pose" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Poses</SelectLabel>
                {Object.entries(poses).map(([poseName, attr]) => (
                  <SelectItem key={poseName} value={poseName}>
                    {attr.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Label htmlFor="prompt">Image prompt</Label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" className="flex gap-2" disabled={loading}>
            Generate {loading && <LoadingIcon />}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full rounded-lg relative">
              {/* Pose Image */}
              {poseLoading && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <LoadingIcon />
                </div>
              )}
              {poseImageUrl && (
                <img
                  className="w-full h-full object-contain"
                  src={poseImageUrl}
                  alt="Selected pose"
                  onLoad={() => setPoseLoading(false)}
                ></img>
              )}
            </div>
            {/* <Separator
              orientation="vertical"
              className="border-gray-200"
              decorative
            /> */}
            <div className="w-full h-full">
              {runId && (
                <ImageGenerationResult
                  key={runId}
                  runId={runId}
                  className="aspect-[768/1152]"
                />
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

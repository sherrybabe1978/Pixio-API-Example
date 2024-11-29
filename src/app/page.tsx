"use client";

import { LoadingIcon } from "@/components/LoadingIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
    <main className="flex min-h-screen flex-col items-center justify-between mt-10 bg-black text-white"> {/* Added bg-black and text-white */}
      {/* ...rest of the page component*/}
    </main>
  );
}

function Txt2img() {
  // ... (Txt2img component remains unchanged)
}

function Img2img() {
  const [prompt, setPrompt] = useState<File | null>(null);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState("");
  const [status, setStatus] = useState<string>();
  const [imageUrl, setImageUrl] = useState(""); // State to hold the image URL

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
          setImageUrl(res.outputs[0]?.data?.images[0].url); // Update imageUrl
          setImage(res.outputs[0]?.data?.images[0].url);
          setLoading(false);
          clearInterval(interval);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  const handleDownload = () => {
    if (!imageUrl) return; // Prevent download if no image URL
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated_image.png"; // Or other suitable filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            setImageUrl(""); // Clear imageUrl on new generation

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
                  "Content-Type": prompt?.type || "",
                  "x-amz-acl": "public-read",
                  "Content-Length": prompt?.size?.toString() || "",
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
            <div>
              <ImageGenerationResult
                key={runId}
                runId={runId}
                className="aspect-square"
              />
              <Button onClick={handleDownload}>Download</Button> {/* Added download button */}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

const poses = {
  // ... (poses remain unchanged)
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
  const [imageUrl, setImageUrl] = useState(""); // State to hold the image URL


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
          setImageUrl(res.outputs[0]?.data?.images[0].url); // Update imageUrl
          setImage(res.outputs[0]?.data?.images[0].url);
          setLoading(false);
          clearInterval(interval);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  const handleDownload = () => {
    if (!imageUrl) return; // Prevent download if no image URL
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated_image.png"; // Or other suitable filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <div>
                  <ImageGenerationResult
                    key={runId}
                    runId={runId}
                    className="aspect-[768/1152]"
                  />
                  <Button onClick={handleDownload}>Download</Button> {/* Added download button */}
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

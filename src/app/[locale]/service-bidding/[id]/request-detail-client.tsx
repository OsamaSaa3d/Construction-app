"use client";

import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock } from "lucide-react";
import {
  acceptServiceBid,
  createServiceBid,
  updateServiceRequestStatus,
} from "@/server/actions/service-bidding.actions";
import type { CreateServiceBidInput } from "@/lib/validations/service-bidding";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  AWARDED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

type Bid = {
  id: string;
  bidderId: string;
  price: { toString(): string };
  currency: string;
  proposal: string;
  estimatedDays: number | null;
  status: string;
  createdAt: Date;
  bidder: { id: string; name: string; role: string };
};

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  status: string;
  budget: { toString(): string } | null;
  currency: string;
  deadline: Date | null;
  images: string;
  createdAt: Date;
  requester: { id: string; name: string; role: string };
  bids: Bid[];
};

type Props = {
  request: ServiceRequest;
  isRequester: boolean;
  myBid: Bid | null;
  userId: string | null;
  locale: string;
};

export function RequestDetailClient({ request, isRequester, myBid, userId, locale }: Props) {
  const t = useTranslations("serviceBidding");
  const tCities = useTranslations("cities");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<{
    price: string;
    proposal: string;
    estimatedDays: string;
  }>();

  const images: string[] = (() => { try { return JSON.parse(request.images); } catch { return []; } })();
  const canBid = userId && !isRequester && !myBid && ["OPEN", "IN_REVIEW"].includes(request.status);

  function handleAcceptBid(bidId: string) {
    if (!confirm(t("confirmAcceptBid"))) return;
    startTransition(async () => {
      const result = await acceptServiceBid(bidId);
      if ("error" in result) { setActionError(result.error ?? "An error occurred"); return; }
      router.refresh();
    });
  }

  function handleStatusUpdate(status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
    if (!confirm(t(`confirm${status.replace("_", "")}`))) return;
    startTransition(async () => {
      const result = await updateServiceRequestStatus(request.id, status);
      if ("error" in result) { setActionError(result.error ?? "An error occurred"); return; }
      router.refresh();
    });
  }

  async function onBidSubmit(values: { price: string; proposal: string; estimatedDays: string }) {
    setBidError(null);
    const data: CreateServiceBidInput = {
      price: Number(values.price),
      proposal: values.proposal,
      estimatedDays: values.estimatedDays ? Number(values.estimatedDays) : undefined,
    };
    startTransition(async () => {
      const result = await createServiceBid(request.id, data);
      if ("error" in result) { setBidError(result.error ?? "An error occurred"); return; }
      reset();
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/service-bidding"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>

      {/* Request header */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t(`categories.${request.category}`)}</Badge>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_COLORS[request.status] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {t(`status.${request.status}`)}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{request.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {tCities(request.city as any)}
          </span>
          {request.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(request.deadline).toLocaleDateString(locale)}
            </span>
          )}
          {request.budget && (
            <span className="font-medium text-foreground">
              {t("budget")}: {request.budget.toString()} {request.currency}
            </span>
          )}
          <span>
            {t("postedBy")} {request.requester.name} &middot;{" "}
            {new Date(request.createdAt).toLocaleDateString(locale)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Description + images */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.description}</p>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="h-36 w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid form (for non-requester, not yet bid) */}
          {canBid && (
            <Card>
              <CardHeader>
                <CardTitle>{t("submitBid")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onBidSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t("bidPrice")} (AED) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("price", { required: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("estimatedDays")}</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register("estimatedDays")}
                        placeholder="e.g. 7"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("proposal")} *</Label>
                    <Textarea
                      {...register("proposal", { required: true })}
                      placeholder={t("proposalPlaceholder")}
                      rows={4}
                    />
                  </div>
                  {bidError && (
                    <p className="text-sm text-destructive">{bidError}</p>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                      {t("submitBid")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* My bid (if already submitted, non-requester) */}
          {!isRequester && myBid && (
            <Card>
              <CardHeader>
                <CardTitle>{t("myBid")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("bidPrice")}</span>
                  <span className="font-medium">
                    {myBid.price.toString()} {myBid.currency}
                  </span>
                </div>
                {myBid.estimatedDays && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("estimatedDays")}</span>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {myBid.estimatedDays} {t("days")}
                    </span>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">{t("proposal")}</p>
                  <p className="text-sm">{myBid.proposal}</p>
                </div>
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[myBid.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {t(`bidStatus.${myBid.status}`)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {!userId && ["OPEN", "IN_REVIEW"].includes(request.status) && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("loginToBid")}{" "}
              <Link href="/login" className="text-primary underline">
                {t("loginLink")}
              </Link>
            </div>
          )}
        </div>

        {/* Right panel: bids (requester) + requester actions */}
        <div className="space-y-4">
          {/* Requester action buttons */}
          {isRequester && (
            <Card>
              <CardHeader>
                <CardTitle>{t("manageRequest")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.status === "AWARDED" && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("IN_PROGRESS")}
                    disabled={isPending}
                  >
                    {t("markInProgress")}
                  </Button>
                )}
                {request.status === "IN_PROGRESS" && (
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t("markCompleted")}
                  </Button>
                )}
                {["AWARDED", "IN_PROGRESS"].includes(request.status) && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={isPending}
                  >
                    {t("cancel")}
                  </Button>
                )}
                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bids list (visible to requester or everyone after AWARDED) */}
          {(isRequester || !["OPEN", "IN_REVIEW"].includes(request.status)) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("bidsReceived")} ({request.bids.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.bids.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("noBids")}</p>
                )}
                {request.bids.map((bid) => (
                  <div key={bid.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{bid.bidder.name}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[bid.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t(`bidStatus.${bid.status}`)}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {bid.price.toString()} {bid.currency}
                      </span>
                      {bid.estimatedDays && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {bid.estimatedDays} {t("days")}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{bid.proposal}</p>
                    {isRequester &&
                      bid.status === "SUBMITTED" &&
                      ["OPEN", "IN_REVIEW"].includes(request.status) && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleAcceptBid(bid.id)}
                          disabled={isPending}
                        >
                          {t("acceptBid")}
                        </Button>
                      )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import type { iProfileFormFields } from "~/routes/settings/edit-profile";
import { classNames } from "~/utilities/main";
import { Link } from "@remix-run/react";
import { SVGAvatarTwo } from "~/assets/SVGs/SVGAvatarTwo";
import SVGEmail from "~/assets/SVGs/SVGEmail";
import SVGLocationPin from "~/assets/SVGs/SVGLocationPin";
import SVGPhone from "~/assets/SVGs/SVGPhone";
import Avatar from "~/components/User/Avatar";
import { APP_ROUTES } from "~/constants";
import USA_States from "~/utilities/US-states.json";
import React from "react";

export default function Profile({
  fields,
  userId,
  viewerId,
  privateView = false,
}: {
  fields: iProfileFormFields;
  userId: number;
  viewerId: number | undefined;
  privateView?: boolean;
}) {
  const iconListClassname = (link = false, isEmpty = false): string => {
    const divStyles = "flex items-center gap-[15px] text-base font-semibold";
    const setToLastStyles = "order-last";
    const linkStyles =
      "hover:text-chw-light-purple cursor-pointer transition-all duration-300 ease-in-out";
    return classNames(
      divStyles,
      link ? linkStyles : "",
      isEmpty ? setToLastStyles : "",
    );
  };

  const getLocation = (): string => {
    const findState = USA_States.find(
      (state) => state.abbreviation === fields.state.value,
    );
    if (!findState) return "";

    let location = findState.name;
    if (fields.zipCode.value) location += `, ${fields.zipCode.value}`;
    return location;
  };

  const userLocation = getLocation();

  const GetAvatar = (): React.ReactNode => {
    return (
      <>
        {fields.avatar.value ? (
          <Avatar
            src={fields.avatar.value}
            alt={`${fields.firstName.value} ${fields.lastName.value}`}
          />
        ) : (
          <SVGAvatarTwo />
        )}
      </>
    );
  };

  const GetButtons = ({
    className,
  }: {
    className?: string;
  }): React.ReactNode => {
    return (
      <div
        className={classNames(
          "flex w-full max-w-[175px] flex-col gap-7 max-md:gap-2",
          className || "",
        )}
      >
        {privateView ? (
          <>
            <Link
              to={`${APP_ROUTES.SETTINGS}/edit-profile`}
              className={classNames(
                "cursor-pointer bg-chw-light-purple text-white hover:border-chw-dark-purple hover:bg-chw-dark-purple",
                "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                "w-full border-2 border-solid border-[#625da6] text-center leading-[normal]",
              )}
            >
              Edit Profile
            </Link>
            <Link
              to={`${APP_ROUTES.PROFILE}/${userId}`}
              className={classNames(
                "rounded-[40px] border-2 border-solid border-chw-light-purple bg-transparent px-[20px] py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white",
                "w-full text-center leading-[normal]",
              )}
            >
              Public View
            </Link>
          </>
        ) : (
          <>
            {viewerId && (
              <>
                {userId !== viewerId && (
                  <Link
                    to={`${APP_ROUTES.MESSAGES}/${userId}`}
                    className={classNames(
                      "cursor-pointer bg-chw-light-purple text-white hover:border-chw-dark-purple hover:bg-chw-dark-purple",
                      "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                      "w-full border-2 border-solid border-[#625da6] text-center leading-[normal]",
                    )}
                  >
                    Message
                  </Link>
                )}
                {userId === viewerId && (
                  <Link
                    to={`${APP_ROUTES.PROFILE}/`}
                    className={classNames(
                      "rounded-[40px] border-2 border-solid border-chw-light-purple bg-transparent px-[20px] py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white",
                      "w-full text-center leading-[normal]",
                    )}
                  >
                    Private View
                  </Link>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-5">
      <div className="h-[11rem] w-[11rem] min-w-[11rem] max-md:hidden">
        <GetAvatar />
      </div>

      <div className="w-full">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="max-w-20 hidden h-24 w-24 max-md:flex">
            <GetAvatar />
          </div>
          <GetButtons className="hidden max-md:flex" />
        </div>

        <div className="mb-12 flex justify-between gap-5 max-md:mb-6 max-md:flex-col">
          <div className="flex flex-1 flex-col gap-7">
            <h1 className="break-all text-[2rem] font-bold text-[#032525]">{`${fields.firstName.value} ${fields.lastName.value}`}</h1>
            {(userLocation ||
              fields.email.value ||
              fields.phoneNumber.value) && (
              <div
                className={classNames(
                  "flex w-full max-w-[28.75rem] flex-col justify-between gap-2.5 font-semibold text-[#686867]",
                  "max-md:max-w-full max-md:flex-row max-md:flex-wrap",
                )}
              >
                <div className={iconListClassname(false, !userLocation)}>
                  {userLocation && (
                    <>
                      <div className="h-8 w-8">
                        <SVGLocationPin />
                      </div>
                      <p>{userLocation}</p>
                    </>
                  )}
                </div>
                <div className={iconListClassname(true, !fields.email.value)}>
                  {fields.email.value && (
                    <a
                      href={`mailto:${fields.email.value}`}
                      className={iconListClassname(true, !fields.email.value)}
                    >
                      <div className="h-8 w-8">
                        <SVGEmail />
                      </div>
                      <span className="break-all">{fields.email.value}</span>
                    </a>
                  )}
                </div>
                <div
                  className={iconListClassname(true, !fields.phoneNumber.value)}
                >
                  {fields.phoneNumber.value && (
                    <a
                      href={`tel:${fields.phoneNumber.value}`}
                      className={iconListClassname(
                        true,
                        !fields.phoneNumber.value,
                      )}
                    >
                      <div className="h-8 w-8">
                        <SVGPhone />
                      </div>
                      <span>{fields.phoneNumber.value}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <GetButtons className="max-md:hidden" />
        </div>
        <div
          className={classNames(
            "mb-5 flex justify-between gap-5 border-b border-solid border-[#C1BAB4] pb-5 text-[#686867]",
            "max-md:flex-col max-md:border-t max-md:pt-5",
          )}
        >
          <InfoColumn title="Age" value={fields.ageRange.value} />
          <InfoColumn
            title="Race/Ethnicity"
            value={fields.ethnicity.value
              .filter((v) => v !== "Not listed")
              .join(", ")}
          />
          <InfoColumn
            title="Gender Identity"
            value={fields.genderIdentity.value
              .filter((v) => v !== "Another gender identity not listed")
              .join(", ")}
          />
        </div>
        <div className="mb-5 flex flex-col gap-5 border-b border-solid border-b-[#C1BAB4] pb-5 text-[#686867]">
          <InfoRow
            title="Preferred Languages"
            value={fields.preferredLanguages.value}
          />
          <InfoRow
            title="Highest Level of Education"
            value={fields.education.value}
          />
          <InfoRow
            title="Populations I've Served"
            value={fields.topPopulations.value
              .filter((v) => v !== "Other")
              .join(", ")}
          />
          <InfoRow
            title="Certified as a Community Health Worker"
            value={fields.certifiedWorker.value ? "Yes" : "No"}
          />

          <InfoRow title="Member" value={fields.memberships.value.join(", ")} />
        </div>
        <div className="">
          {fields["about-me"].value && (
            <>
              <h3 className="mb-5 text-lg font-semibold text-[#032525]">
                About Me:
              </h3>
              <div className="text-lg leading-5 text-[#032525]">
                {fields["about-me"].value}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoColumn({ title, value }: { title: string; value: string }) {
  return (
    <>
      {value && (
        <h3 className="w-full font-semibold">
          {title}: <span className="font-normal">{value}</span>
        </h3>
      )}
    </>
  );
}

function InfoRow({ title, value }: { title: string; value: string }) {
  return (
    <>
      {value && (
        <h3 className="inline pr-[5px] font-semibold">
          {title}: <span className="inline font-normal">{value}</span>
        </h3>
      )}
    </>
  );
}

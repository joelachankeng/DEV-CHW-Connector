- my group route - when remove unfollow group, update counter
- change delete post, message and comment mutation to a custom mutation that also deletes a post/comments attachments, reactions, and any child comments.
- fix emoji resize on mobile by trigger mobile with dispatchEvent
- clicking on the editor when content is present moves cursor to the beginning - only apply focus when there no content
- remove .cdx-input.image-tool\_\_caption from global and hide the right way
- fix issue with submitting posts, nagivationprompt doesn't work on feed route,
- ESLint entire project and fix issues with useEffects
- write cron to delete users in 30 days
- - on WP, set a deleted avatar for deleted users
- - change username, first/last name in WP to Deleted User
- - change email to deleted_userID@deleted.com
- - change password
- - add hook to make sure that noone can login on WP/APP with the email @deleted.com
- - set all user fields to blank
- - only deleted taxonomies
- - make sure profile page isn't accessibile on app / or this user has been deleted or move page.
- fix left sidebar when screen height is small - the sidebar doesn't scroll all the way to the bottom. Need to add function to detect if sidebar inner content height is greater than window height and then set height to 100vh - headerHeight and if scrolll alway to bottom - 100vh - HeaderHeight and footerHeight
- go to edit profile route and click on edit profile again in the header, it goes to /settings instead of /edit-profile
- go through design and make sure nothing is missing
- change edit-profile to use submitting actiondata flow from app\components\Settings\Notifications\NotificationSettingsForm.tsx because it own current hook showing loading spinner if action returns the same copy of profilefield
- change executio and any functions returning TypedResponse to use a type ex:TypedResponse<{ success: iNotificationSettings } | iGenericError>
- unstable_usePrompt works on chw network feed but doens't work elsewhere
- fix emoji popup on Add New Post Comment when user clicks it before typing anything
- change savePost route to bookmarkPost to avoid confusation
- CHANGE all wordpress fields that editable on the Remix app to WSIWYG editor
- The Communities Sidebar is hardcoded but I plan to add the ability to change it in the admin dashboard later.
- uploader manager should have continous scroll for text and it should say - "Your files are uploading. You can continue browsing the site, however don't close the browser/app until all uploads are finished." https://stackoverflow.com/questions/45847392/pure-css-continuous-horizontal-text-scroll-without-break
- move login and signup functionality to background functions
- add preventdefault to buttons to see if it fix jumping up on mobile app
- add ability to block user on profile page - blocking hides the user's profile from each other, both can't send/recieve messages or see their comments or post in feeds.
- all comment modal - try CSS translating X to the whole nav div to left to hide the right slider buttton if the # of items doesn't go to next row
- comment's input is too small on mobile to touch https://www.mobiloud.com/docs/custom-css
- - fix by clicking anywhere on yellow should focus on the editorjs
- reset password on edit profile should be disable for MC users
- add option for users to delete their own posts/comments
- USE THis for pagination - https://www.youtube.com/watch?v=g_H07EPIHz0
- add editorjs validation function to submission for new comments and post. Editorjs has validation function
- make a button component and replace all HTML tag buttons
- when a user submits a comment, make sure user is a member of the group that the comment was posted
- change page title based on routes
- fix video on editor
- in session or root, make a fuuction to test that the wordpress constants in functions.php are right, else kill the app
- make button component
  - make this a cron job and send email to admins
  - make a function or call to rest api to make sure session secret and iv work
- wrap form component on all component/routes that does an action
- public health alerts right sidebar should say "additional resources" instead of commuity gudieleines
- search for /communities and /chw-networks and replace strings with constants
- add wordpress code that prevent accounts created with MC from changing password in admin dashboard or just hide the password field with css
- add a simple report form like linkedin or reddit and send email to admins when a post is reported.
- make PostFeed component and replace feed page, communities and networks pages with it
- add error notificaiton toast for all submissions
- before a user post check if they are a memeber
- combine PublicHealthAlertsBanner into one component
- use an outlet like this - https://www.youtube.com/watch?v=DdyNViscy94
  -- move index code to login, and copy feed into index, use outlet on index, make folder other routes on navigation
  -- create another outlet for public health alerts, in the loader for the parent route, get the request url, if url is similar /public-health-alerts/726, get id after last slash, query for alert with the id, pass that data on to the outletContext
- develop not found page
- feed not getting more recent post on "ALL" option
- add back to top for all feed
- create member taxonomy for networks and communities, title wil ber userid-networkId and meta fields for
  userid and network id
- update design of not found result on profile route
- update reported post to only show for the original poster and the reporters
- fix comments giphy not displaying
- fix sidebar scrolling down, it intersects with footer - left notes in code
- comment doesn't clear after submitting
- add option to edit/delete comments - look further down on instructions on how to delete comments
- add logs whenever something fails
- before a comment is deleted, it needs to update all its direct children parentId to its own parentId. This prevents a deleted comment in a stack from moving all children to root
- check data to parse from json (updated DELETED_COMMENT)
- check all custom graphql queries for int, if the int is empty, it will throw an error. Before resolving the array, find keys with int and unset them
- to get count without querying all data
  -- do https://stackoverflow.com/questions/6069237/fastest-way-to-count-exact-number-of-rows-in-a-very-large-table
  -- or add WP_CHW_COUNT table and a rows for each post and autoincrement them based on users interaction and then run cron job at night to recalculate the count.
- update score for post when react, comments, share is add/removed
- attach videos should play in the editor with video tag with the option to download
- prevent anyone from accessing the frontend posts and taxonimes on wordpress, add to a redirect to the react website in php
- test all input fields with long text and truncate them
- make sure all group/post name/usernames are word-break
- make photo and video button work for videos
- figure out weird jump effect when comment uncollapses
- search in code 'http'
  and replace with ENV keys - handle memberclicks expiration for client credential token
  and user login token - restrict api routes with token
  from
  ENV -
  set
  return types for all server.ts functions - replace codes with ENV variables -- add invariant
  - use prefetch on components - https: / / www.youtube.com / watch ? v = 4jT7iKdqoW4 - create not found - Implement a bear token to all REST API on WP site - figure how to block external domain
    from
    requesting API routes - integrate mailgun - send welcome email
    when user signs up - send updates email wehn user is inactive for a week - remove console.log -
    add
    404 - ask Jon about mobile version of the footer - disabled subscribers roles
    from
    accessing wp - admin - change sign in on the footer to sign out if logged in - check to see if WP sends an email to the user
    when a new account is created,
    and remove it -
    set
    rate
    limit
    on ip address: - creating multiple accounts in a day - fail login attempts -
    add
    recaptcha - find
    and replace "px]" with rem - prevent subscriber roles
    from
    login
    and forgot password on WordPress site.- change functionality for "send reset link" in dashboard - / wp - admin / user - edit.php - HIDE MC users 's password field in WP Dashboard so admins won' t change their password
    and breaks things -
    add
    cors to api routes,
    try netlify.toml ? - send confirmation email to verify email
    when new account is created - create new mailgun template -
    add
    verify link to profile so: / profile / ? verify = sdjh43u9 - prevent users
    from
    posting anything until verify email '
- create a usercontext, messagecontext and feedcontext to share data throughout the app
- - only query all userdata once on login and save to context to prevent requeries
- create a cron
- - react app will create a json and store data from WordPress similar to cache to make site faster instead of consistently querying. MIGHT NOT BE NECCESSARY IF CONTEXT DOES THE SAME THING
    Features

- add error section on WP, remix should create a WP post whenever an error occurred with the user information.
- - store userdata as cookie and send with error if possible
- add activity log for users
- add roles
- - admin can CRUD anything
- - group admins can only CRUD the assigned group
- add permissions submenu to WP User menu, it should allows admin to set roles and which assigned groups, also ability to view messages or the attached user on a reported content
- on mobile, add collapse and ellipes for long username, long commments, group names,
- auto sign out after 5 mins of inactivity
- add animations according to XD (sliding on HP when sign up is clicked)
- create a json file with all memberclicks email, refresh each day
- - use the above instead of fetching MC on sign up form - https://tinloof.com/blog/how-to-build-cron-jobs-with-netlify-functions
- install extension to remove ununsed imports in files
- add mailgun when new account is created, notifications, and if user has visited for a while
- redirect all urls on WordPress to react app except admin login
- change wp admin login url for more security
- add editorjs to WordPress and add preview tab to content
- review https://getstream.io/chat/docs/ and add features : add user tagging
- add cron job to delete all categories and attachments for deleted posts
- cron job should also recalculate all scores for posts
- develop a logger controller that sends all errors to wp site
- add skip content link to top page
- users for reaction is limit to 100 per request, add pagination
- figure out EditorJS errors when switching tabs on feed
- when save post data, extract all paragraphs element and store in a seperate post field that will be used for search
- don't use editorJS readonly, try using the npm package to convert the block to raw html
- search for // TO FIX comment via VSCode and fix all issues
- update user avatar with this solution 2nd answer, set url to /wp-content/user/123/avatar.jpg https://stackoverflow.com/questions/13911452/change-user-avatar-programmatically-in-wordpress
- get emoji data json and check the emojiId against it before saving reactions
- emoji plugin imports multiple times, fix it to load once
- look at slack notes
- refresh tokens after 60 if user still active
- maybe add ability to block usrs

  POSTLAUNCH

- pantheon allows 1024 mysql connections - talk to chris about this
- change all external image and a href links in mailgun to production url
  Simple JWT settings
  -change route namespace to chw-authenticator/v1/
- disable register, delete user, and reset password
- add domain to cors
- change all template/versions in mailgun, logo url to production site
- change all urls in the env var to production urls

# WordPress

Add plugin cors plugin

- From the WordPress admin sidebar, go to GraphQL > Settings and click the CORS Settings tab.
- Check the checkboxes next to these options:
- – Send site credentials
- – Enable login mutation
- – Enable logout mutation
- In the Extend "Access-Control-Allow-Origin” header field, enter the remix app domain

- read docs, upload to teams -> teams sidebar -> IT -> Web Teams -> Files nav -> create chw connector folder and word document

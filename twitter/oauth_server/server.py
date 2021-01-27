#/usr/bin/python
# encoding: utf-8

#-----------------------------------------------------------------------------------------------------------------------------
# Twitter Simple OAuth server. This is used for obtaining a request token
# using the TwitterApp credentials
# We have used this guide as a reference 
# https://developer.twitter.com/en/docs/twitter-for-websites/log-in-with-twitter/guides/implementing-sign-in-with-twitter
#-----------------------------------------------------------------------------------------------------------------------------

from requests_oauthlib import OAuth1Session
from falcon_cors import CORS
import coloredlogs, logging
import os.path
import requests
import json
import time
import falcon, json

# Logger Initialisation
logger = logging.getLogger('OAUTH_TWITTER_SERVER')
# Coloredlogs initialization
coloredlogs.install(level='DEBUG', logger=logger)
# CORS - Allow requests of cross-origin
cors_allow_all = CORS(
	allow_all_origins=True,
	allow_all_headers=True,
	allow_all_methods=True
)

# Parsing the config.py file
config = {}
logger.info('Reading from Config File')
exec(compile(open("config.py", "rb").read(), "config.py", 'exec'), config)
logger.info('Config file was read successfully ')


# RequestTokens Pseudo Cache for the time being
oauth_verifiers = {}


class GetOAuthRequestToken:
	"""
	GetOAuthRequestToken is a helper API class that provides the /twitter_oauth/request_token endpoint
	The API endpoint communicates with twitter and via the consumer key/secret an access token is obtained.
	This access token will be used to authenticate a user and obtain his consumer key/secret for enhancing our tw database with keys
	"""
	cors = cors_allow_all

	def on_get(self, req, resp):
		try:
			resp.status = falcon.HTTP_200
			twitter_oauth1 = OAuth1Session(config['consumer_key'], client_secret=config['consumer_secret'])
			twitter_endpoint = config['twitter_oauth_request_token_endpoint']

			logger.info('Attempting to perform an OAuthRequestToken to Twitter - Step 1')
			req = twitter_oauth1.get(twitter_endpoint)
			logger.info('Request completed')

			logger.info('Token acquired. Parsing and returning answer to user')
			request_token = req.content.decode('utf-8')

			sp = request_token.split('&')
			if len(sp) != 3:  # oauth_token, oauth_token_secret, oauth_callback_confirmed
				logger.error('Error occurred while attempting to obtain request token parameters are not 3 as expected')
				resp.status = falcon.HTTP_500
				to_return = json.loads(request_token)
				logger.error(to_return)
				logger.error('Returning response...')
				resp.body = json.dumps(to_return)
			else:
				oauth = {
					'oauth_token': sp[0].split('=')[1],
					'oauth_token_secret': sp[1].split('=')[1],
					'oauth_callback_confirmed': bool(sp[2].split('=')[1])
				}

				logger.info('Saving oauth token to the oauth verifiers list')
				oauth_verifiers[oauth['oauth_token']] = oauth
				logger.info('Returning response obtained from server')
				logger.info(oauth)
				resp.body = json.dumps(oauth)
		except Exception as ex:
			resp.status = falcon.HTTP_500
			logger.error('GetOauthRequestToken - Exception Occurred')
			logger.error(str(ex))
			er = {
				'message': "Internal Server Error. Contact your Administrator"
			}
			resp.body = json.dumps(er)


class OAuthCallback:
	"""
	SigInWithTwitter acts as a callback url so that as soon as the user hits authorize, the Twitter will use this 
	callback URL to inform our service that the user has given the necessary authorization of the Twitter Application
	"""

	cors = cors_allow_all

	def on_get(self, req, resp):
		try:
			
			resp.content_type = 'text/html'

			logger.info('Redirecting the User - Step 2 - User has now authorized the APP')
			logger.info('Following oauth_token and oauth_verifier acquired')

			oauth_token = req.get_param('oauth_token')
			oauth_verifier = req.get_param('oauth_verifier')

			if  oauth_token is None or oauth_verifier is None:
				resp.status = falcon.HTTP_400
				logger.info('There is no oauth_token or oauth_verifier')
				resp.body = 'There is no oauth_token or oauth_verifier'
				return

			logger.info('oauth_token: ' + oauth_token)
			logger.info('oauth_verifier: ' + oauth_verifier)

			if oauth_token in  oauth_verifiers:
				oauth_verifiers[oauth_token]['oauth_verifier'] = oauth_verifier
				logger.info('Updated OAuth Verifier list')
				logger.info(oauth_verifiers)
				resp.body = open('CloseWindowSuccess.html', 'r').read()
			else:
				logger.info('OAuth Token seems to be missing from this list. Try re-asking the user again to authorize')
				resp.body = open('CloseWindowFail.html', 'r').read()

		except Exception as ex:
			resp.status = falcon.HTTP_500
			logger.error('OAuthCallback- Exception Occurred')
			logger.error(str(ex))
			er = {
				'message': "Internal Server Error. Contact your Administrator"
			}
			resp.body = json.dumps(er)


class ConvertToAccessToken:
	"""
	Convert to Access Token is the third and last step of the implementation of Twitter OAuth1. We must now transform the oauth verifier to
	valid access tokens. Thus we need to perform an OAuth1 request to POST /oauth/access_token and obtain the access tokens. More below
	"""

	cors = cors_allow_all

	def on_get(self, req, resp, oauth_token):
		try:
			resp.status = falcon.HTTP_200
			twitter_endpoint = config['twitter_oauth_transform_token_endpoint']
			# Obtain consumer key and consumer secret key
			client_id = config['consumer_key']
			client_secret = config['consumer_secret']
			
			# Obtain oauth token secret and oauth verifier from the oauth verifiers structure that server is aware
			# If an exception is thrown then this means that the oauth_verifier is not present and thus step 2 did no succeed
			# and thus HTTP_404 response code will be sent along with the exception message
			try:
				oauth_token_secret = oauth_verifiers[oauth_token]['oauth_token_secret']
				verifier = oauth_verifiers[oauth_token]['oauth_verifier']
			except Exception:
				logger.error('Failed to resolve either oauth_token, oauth_token_secret, oauth_verifier')
				er = {
					'exception':  "No oauth token secret or verifier are known"
				}
				resp.status = falcon.HTTP_404
				resp.body = json.dumps(er)
				return

			# Initialize the session object which is an OAuth1Session
			# The below configuration is the OAuth1 request having resource owner key/secret (oauth_token/secret) as the
			# below resource demonstrates.
			# The verifier is also being given as an input as the resource below demonstrates
			# https://requests-oauthlib.readthedocs.io/en/latest/oauth1_workflow.html
			session = OAuth1Session(
				client_id, client_secret,
				resource_owner_key=oauth_token,
				resource_owner_secret=oauth_token_secret,
				verifier=verifier)

			logger.info(
				'Attempting to perform an OAuthRequestToken to Twitter to transform the verifier to access token - '
				'Step 3'
			)
			token = session.fetch_access_token(twitter_endpoint)
			logger.info('Request completed')
			logger.info('Returning response')
			logger.info(token)
			resp.body = json.dumps(token)

		except Exception as ex:
			resp.status = falcon.HTTP_500
			logger.error('OAuthCallback- Exception Occurred')
			logger.error(str(ex))
			er = {
				'message': "Internal Server Error. Contact your Administrator"
			}
			resp.body = json.dumps(er)


###################################################################################################
# API CALLS DEFINITION
###################################################################################################
api = falcon.API(middleware=[cors_allow_all.middleware])
api.add_route('/twitter_oauth/request_token', GetOAuthRequestToken())
api.add_route('/twitter_oauth/oauth_callback', OAuthCallback())
api.add_route('/twitter_oauth/convert_to_access_token/{oauth_token}', ConvertToAccessToken())
###################################################################################################
